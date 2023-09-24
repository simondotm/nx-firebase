import {
  GeneratorCallback,
  getProjects,
  joinPathFragments,
  logger,
  readProjectConfiguration,
  runTasksInSerial,
  Tree,
  updateProjectConfiguration,
  writeJson,
} from '@nx/devkit'

import { SyncGeneratorSchema } from './schema'
import { FirebaseFunction, setFirebaseConfigFromCommand } from '../../utils'
import initGenerator from '../init/init'

import {
  debugInfo,
  getFirebaseScopeFromTag,
  isFirebaseApp,
  updateFirebaseAppDeployProject,
  CONFIG_NO_APP,
  updateFirebaseProjectNameTag,
  getFirebaseWorkspace,
  renameCommandForTarget,
} from './lib'
import { runMigrations } from '../migrate/lib/migrate'

const FUNCTIONS_DEPLOY_MATCHER = /(--only[ =]functions:)([^\s]+)/

/**
 * Sync firebase workspace
 *
 */
export async function syncGenerator(
  tree: Tree,
  options: SyncGeneratorSchema,
): Promise<GeneratorCallback> {
  const tasks: GeneratorCallback[] = []

  // initialise plugin
  const initTask = await initGenerator(tree, {})
  tasks.push(initTask)

  // otherwise, sync the workspace.
  // build lists of firebase apps & functions that have been deleted or renamed
  debugInfo('- Syncing workspace')

  const workspace = getFirebaseWorkspace(tree)

  logger.info(
    `This workspace has ${workspace.firebaseAppProjects.size} firebase apps and ${workspace.firebaseFunctionProjects.size} firebase functions\n\n`,
  )

  // run migrations if required
  if (options.migrate) {
    runMigrations(tree, workspace)
    return
  }

  // change the firebase project for an nx firebase app project
  if (options.project) {
    // --project option requires --app option to be specified
    if (!options.app) {
      throw new Error('--app not specified for --project option')
    }
    // validate app parameter
    const project = readProjectConfiguration(tree, options.app)
    if (!isFirebaseApp(project)) {
      throw new Error(`Project '${options.app}' is not a Firebase application.`)
    }
    debugInfo(`- changing project for ${options.app} to ${options.project}`)
    if (updateFirebaseAppDeployProject(project.targets.firebase, options)) {
      updateProjectConfiguration(tree, options.app, project)
    }
    return
  }

  /**
   * Nx automatically:
   * - updates implicitDependencies when projects are renamed with `nx g mv`
   * - deletes implicitDependencies when projects are deleted with `nx g rm`
   * So we do not have to consider these scenarios.
   */

  // 1. remove any orphaned firebase config files that no longer linked to an app
  workspace.firebaseConfigProjects.forEach((projectName, configName) => {
    if (projectName === CONFIG_NO_APP) {
      debugInfo(`- found firebase config ${configName} with no app`)
      tree.delete(configName)
      // its ok to delete keys in forEach
      workspace.firebaseConfigProjects.delete(configName)
      workspace.firebaseConfigs.delete(configName)
      // dont need to sync firebaseAppConfigs since this app wont exist in there
      logger.info(
        `CHANGE Firebase config '${configName}' is no longer referenced by any firebase app, deleted`,
      )
    }
  })

  // 2. rename firebase config files too if app is renamed
  workspace.renamedApps.forEach((project, oldProjectName) => {
    const configFileName = workspace.firebaseAppConfigs.get(project.name)
    // dont rename config file if it is firebase.json
    if (configFileName === 'firebase.json') {
      logger.info(
        `CHANGE Firebase app '${oldProjectName}' linked to primary config file was renamed to '${project.name}', skipping rename of '${configFileName}'`,
      )
    } else {
      const config = workspace.firebaseConfigs.get(configFileName)

      // create a copy of the firebase config with the renamed project name
      const newConfigFileName = `firebase.${project.name}.json`
      writeJson(tree, newConfigFileName, config)

      // rewrite the --config=<configFileName> part of the firebase target command
      setFirebaseConfigFromCommand(project, newConfigFileName)

      // write the updated project
      updateProjectConfiguration(tree, project.name, project)

      // delete the original config from the workspace
      tree.delete(configFileName)

      // rewrite the workspace to the newly renamed config file
      workspace.firebaseConfigs.delete(configFileName)
      workspace.firebaseAppConfigs.delete(project.name)
      workspace.firebaseConfigProjects.delete(configFileName)

      workspace.firebaseConfigs.set(newConfigFileName, config)
      workspace.firebaseAppConfigs.set(project.name, newConfigFileName)
      workspace.firebaseConfigProjects.set(newConfigFileName, project.name)

      logger.info(
        `CHANGE Firebase app '${oldProjectName}' was renamed to '${project.name}', renamed config file to '${newConfigFileName}'`,
      )
    }
  })

  // 3. update the firebase:name tag for renamed apps
  workspace.renamedApps.forEach((project, oldName) => {
    updateFirebaseProjectNameTag(tree, project)
    logger.info(
      `CHANGE Firebase app '${oldName}' was renamed to '${project.name}', updated firebase:name tag`,
    )

    // we also need to update nx:run-commands in the renamed projects for various targets

    // test target
    renameCommandForTarget(
      tree,
      project,
      'test',
      `tag:firebase:dep:${oldName}`,
      `tag:firebase:dep:${project.name}`,
    )
    // lint target
    renameCommandForTarget(
      tree,
      project,
      'lint',
      `tag:firebase:dep:${oldName}`,
      `tag:firebase:dep:${project.name}`,
    )
    // watch target
    renameCommandForTarget(
      tree,
      project,
      'watch',
      `tag:firebase:dep:${oldName}`,
      `tag:firebase:dep:${project.name}`,
    )
    // serve target
    renameCommandForTarget(
      tree,
      project,
      'serve',
      `${oldName}:`,
      `${project.name}:`,
    )
    // deploy target
    renameCommandForTarget(
      tree,
      project,
      'deploy',
      `${oldName}:`,
      `${project.name}:`,
    )
    // getconfig target
    renameCommandForTarget(
      tree,
      project,
      'getconfig',
      `${oldName}:`,
      `${project.name}:`,
    )
    renameCommandForTarget(
      tree,
      project,
      'getconfig',
      `/${oldName}/`,
      `/${project.name}/`,
    )
    // killports target
    renameCommandForTarget(
      tree,
      project,
      'killports',
      `${oldName}:`,
      `${project.name}:`,
    )
    // emulate target
    renameCommandForTarget(
      tree,
      project,
      'emulate',
      `/${oldName}/`,
      `/${project.name}/`,
    )
    renameCommandForTarget(
      tree,
      project,
      'emulate',
      `${oldName}:`,
      `${project.name}:`,
    )
    logger.info(
      `CHANGE Firebase app '${oldName}' was renamed to '${project.name}', updated targets`,
    )
  })

  // 4. update the firebase:dep tag for functions linked to renamed apps
  workspace.firebaseFunctionProjects.forEach((project, name) => {
    const { tagValue, tagIndex } = getFirebaseScopeFromTag(
      project,
      'firebase:dep',
    )
    if (workspace.renamedApps.has(tagValue)) {
      // update the firebase:dep tag
      const renamedApp = workspace.renamedApps.get(tagValue)
      project.tags[tagIndex] = `firebase:dep:${renamedApp.name}`
      logger.info(
        `CHANGE Firebase app '${tagValue}' was renamed to '${renamedApp.name}', updated firebase:dep tag in firebase function '${name}'`,
      )
      // update the environment assets glob also
      const functionAssets = project.targets.build.options.assets
      for (const asset of functionAssets) {
        if (typeof asset === 'object') {
          if (asset.input) {
            asset.input = renamedApp.root
            logger.info(
              `CHANGE Firebase app '${tagValue}' was renamed to '${renamedApp.name}', updated environment assets path in firebase function '${name}'`,
            )
          }
        }
      }
      // update the function project config
      updateProjectConfiguration(tree, project.name, project)
    } else {
      if (
        workspace.deletedApps.has(tagValue) ||
        !workspace.firebaseAppProjects.has(tagValue)
      ) {
        logger.warn(
          `CHANGE Firebase app '${tagValue}' was deleted, firebase:dep tag for firebase function '${name}' is no longer linked to a Firebase app.`,
        )
      }
    }
  })

  // 5. update the firebase:name tag for renamed functions
  workspace.renamedFunctions.forEach((project, oldName) => {
    updateFirebaseProjectNameTag(tree, project)
    logger.info(
      `CHANGE Firebase function '${oldName}' was renamed to '${project.name}', updated firebase:name tag`,
    )
  })

  // 6. update the deploy command for renamed functions
  workspace.renamedFunctions.forEach((project, oldName) => {
    const deployCommand = project.targets.deploy.options.command
    project.targets.deploy.options.command = deployCommand.replace(
      FUNCTIONS_DEPLOY_MATCHER,
      '$1' + project.name,
    )
    logger.info(
      `CHANGE Firebase function '${oldName}' was renamed to '${project.name}', updated deploy target to '--only=functions:${project.name}'`,
    )
    updateProjectConfiguration(tree, project.name, project)
  })

  // 7. sync firebase configs for deleted & renamed functions
  workspace.firebaseConfigs.forEach((config, configFileName) => {
    let configUpdated = false

    const functions = config.functions as FirebaseFunction[]
    const updatedFunctions: FirebaseFunction[] = []
    // remove deleted functions
    functions.forEach((func) => {
      // remove functions where codebase is linked to a now deleted firebase function project
      if (workspace.deletedFunctions.has(func.codebase)) {
        logger.info(
          `CHANGE Firebase function '${func.codebase}' was deleted, removing function codebase from '${configFileName}'`,
        )
        configUpdated = true
      } else {
        // rename function codebase if linked to a renamed firebase function project
        const codebase = func.codebase
        debugInfo(`- checking if codebase '${codebase}' is renamed`)
        if (workspace.renamedFunctions.has(codebase)) {
          // change name of codebase
          const project = workspace.renamedFunctions.get(codebase)

          debugInfo(`- codebase '${codebase}' is renamed to ${project.name}`)

          func.codebase = project.name
          // change source dir
          func.source = project.targets.build.options.outputPath
          logger.info(
            `CHANGE Firebase function '${codebase}' was renamed to '${project.name}', updated codebase in '${configFileName}'`,
          )
          configUpdated = true
        }
        updatedFunctions.push(func)
      }
    })
    if (configUpdated) {
      config.functions = updatedFunctions
      config.functions.sort((a: FirebaseFunction, b: FirebaseFunction) => {
        return a.codebase < b.codebase ? -1 : a.codebase > b.codebase ? 1 : 0
      })
      writeJson(tree, configFileName, config)
    }
  })

  // 8. sync firebase configs for rules & hosting for renamed apps
  workspace.renamedApps.forEach((project, oldProjectName) => {
    const configFileName = workspace.firebaseAppConfigs.get(project.name)
    const config = workspace.firebaseConfigs.get(configFileName)

    // update config rules that are in the firebase app
    const databaseRules = joinPathFragments(project.root, 'database.rules.json')
    if (config.database && config.database.rules !== databaseRules) {
      config.database.rules = databaseRules
      logger.info(
        `CHANGE Firebase app '${oldProjectName}' was renamed to '${project.name}', updated database rules in '${configFileName}'`,
      )
    }

    const firestoreRules = joinPathFragments(project.root, 'firestore.rules')
    if (config.firestore && config.firestore.rules !== firestoreRules) {
      config.firestore.rules = firestoreRules
      logger.info(
        `CHANGE Firebase app '${oldProjectName}' was renamed to '${project.name}', updated firestore rules in '${configFileName}'`,
      )
    }

    const firestoreIndexes = joinPathFragments(
      project.root,
      'firestore.indexes.json',
    )
    if (config.firestore && config.firestore.indexes !== firestoreIndexes) {
      config.firestore.indexes = firestoreIndexes
      logger.info(
        `CHANGE Firebase app '${oldProjectName}' was renamed to '${project.name}', updated firestore indexes in '${configFileName}'`,
      )
    }

    const storageRules = joinPathFragments(project.root, 'storage.rules')
    if (config.storage && config.storage.rules !== storageRules) {
      config.storage.rules = storageRules
      logger.info(
        `CHANGE Firebase app '${oldProjectName}' was renamed to '${project.name}', updated storage rules in '${configFileName}'`,
      )
    }

    writeJson(tree, configFileName, config)
  })

  // 9. validate hosting rules match a project
  workspace.firebaseConfigs.forEach((config, configFileName) => {
    const projects = getProjects(tree)
    if (!Array.isArray(config.hosting)) {
      config.hosting = [config.hosting]
    }
    config.hosting.forEach((host) => {
      let isValid = false
      projects.forEach((nxProject) => {
        if (host.public.includes(nxProject.root)) {
          isValid = true
        }
      })
      if (!isValid) {
        logger.warn(
          `Can't match hosting target '${host.target}' public dir '${host.public}' in  '${configFileName}' to a project in this workspace. Is it configured correctly?`,
        )
      }
    })
  })

  // if user deletes a project that was linked to firebase.json config but there
  // are other firebase apps in the workspace, we need to inform user about
  // this, since we dont have a way
  // other firebase apps in the workspace, we'll just advise
  if (!tree.exists('firebase.json') && workspace.firebaseAppProjects.size) {
    logger.warn(
      `None of the Firebase apps in this workspace use 'firebase.json' as their config. Firebase CLI may not work as expected. This can be fixed by renaming the config for one of your firebase projects to 'firebase.json'.`,
    )
  }

  return runTasksInSerial(...tasks)
}

export default syncGenerator
