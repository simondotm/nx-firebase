import {
  GeneratorCallback,
  logger,
  readProjectConfiguration,
  runTasksInSerial,
  Tree,
  updateProjectConfiguration,
  writeJson,
} from '@nx/devkit'

import { SyncGeneratorSchema } from './schema'
import { FirebaseFunction } from '../../utils'
import initGenerator from '../init/init'

import {
  debugInfo,
  getFirebaseScopeFromTag,
  isFirebaseApp,
  updateFirebaseAppDeployProject,
  CONFIG_NO_APP,
  mapKeys,
  updateFirebaseProjectNameTag,
} from './lib'
import { getFirebaseWorkspace } from './lib/firebase-workspace'

const FUNCTIONS_DEPLOY_MATCHER = /(--only[ =]functions:)([A-Za-z-]+)/

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

  // otherwise, sync the workspace.
  const workspace = getFirebaseWorkspace(tree)

  logger.info(
    `This workspace has ${workspace.firebaseAppProjects.size} firebase apps and ${workspace.firebaseFunctionProjects.size} firebase functions\n\n`,
  )

  workspace.deletedApps.forEach((deleted, projectName) => {
    logger.info(`  SYNC Firebase app '${projectName}' has been deleted`)
  })
  workspace.deletedFunctions.forEach((deleted, projectName) => {
    logger.info(`  SYNC Firebase function '${projectName}' has been deleted`)
  })
  workspace.renamedApps.forEach((project, oldProjectName) => {
    logger.info(
      `  SYNC Firebase app '${project.name}' has been renamed from '${oldProjectName}'`,
    )
  })
  workspace.renamedFunctions.forEach((project, oldProjectName) => {
    logger.info(
      `  SYNC Firebase function '${project.name}' has been renamed from '${oldProjectName}'`,
    )
  })

  // build lists of firebase apps & functions that have been deleted or renamed
  debugInfo('- Syncing workspace')

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

  // TODO: rename firebase config files too if app is renamed
  workspace.renamedApps.forEach((projectName, oldProjectName) => {
    // rename the config file
    // tree.delete(oldProjectName)
    // tree.write()
    // update the --config in the project
  })

  // 1. Delete firebase config for any deleted apps
  // for (const deletedApp in workspace.deletedApps) {
  //   const deletedAppConfigName = calculateFirebaseConfigName(tree, deletedApp)
  //   tree.delete(deletedAppConfigName)
  //   logger.info(
  //     `CHANGE ${deletedApp} app was deleted, removing its firebase config file ${deletedAppConfigName}`,
  //   )
  // }

  // update the firebase:name tag for all renamed projects
  workspace.renamedApps.forEach((project, oldName) => {
    updateFirebaseProjectNameTag(tree, project)
    logger.info(
      `CHANGE Firebase app '${oldName}' was renamed to '${project.name}', updated firebase:name tag`,
    )
  })
  workspace.renamedFunctions.forEach((project, oldName) => {
    updateFirebaseProjectNameTag(tree, project)
    logger.info(
      `CHANGE Firebase function '${oldName}' was renamed to '${project.name}', updated firebase:name tag`,
    )
  })
  // update the deploy command for renamed functions
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

  // update the firebase:dep tag for functions linked to renamed apps

  // now sync the selected firebase apps
  workspace.firebaseAppProjects.forEach(
    (firebaseAppProject, firebaseAppName) => {
      /**
       * Nx automatically:
       * - updates implicitDependencies when projects are renamed with `nx g mv`
       * - deletes implicitDependencies when projects are deleted with `nx g rm`
       * So we do not have to consider these scenarios.
       */

      // // 1. update the firebase app name tag if it has been renamed
      // let firebaseAppUpdated = false
      // const appNameTag = getFirebaseScopeFromTag(
      //   firebaseAppProject,
      //   'firebase:name',
      // )
      // if (workspace.renamedApps.has(appNameTag.tagValue)) {
      //   const newAppNameTag = `firebase:name:${workspace.renamedApps.get(
      //     appNameTag.tagValue,
      //   )}`
      //   firebaseAppProject.tags[appNameTag.tagIndex] = newAppNameTag
      //   logger.info(
      //     `CHANGE firebase app name tag for renamed firebase app '${firebaseAppName}' from '${appNameTag.tagValue}' to '${newAppNameTag}'`,
      //   )
      //   firebaseAppUpdated = true
      // }

      // if (firebaseAppUpdated) {
      //   firebaseAppProject.implicitDependencies.sort() // just sort it anyway
      //   updateProjectConfiguration(tree, firebaseAppName, firebaseAppProject)
      // }

      // 2. handle deleted or renamed firebase apps by updating firebase:dep:<name> tags in functions
      // also update the deploy command
      firebaseAppProject.implicitDependencies?.map((firebaseFunctionName) => {
        let firebaseFunctionUpdated = false
        const firebaseFunctionProject =
          workspace.firebaseFunctionProjects.get(firebaseFunctionName)
        // only investigate deps that are function projects
        // user might add other deps, or it might be the firebase config
        if (firebaseFunctionProject) {
          const { tagValue, tagIndex } = getFirebaseScopeFromTag(
            firebaseFunctionProject,
            'firebase:dep',
          )
          if (tagValue) {
            if (workspace.renamedApps.has(tagValue)) {
              const renamedFunction = workspace.renamedApps.get(tagValue)
              firebaseFunctionProject.tags[
                tagIndex
              ] = `firebase:dep:${renamedFunction.name}`
              logger.info(
                `CHANGE updated firebase:dep tag in firebase function '${firebaseFunctionName}' from '${tagValue}' to renamed to firebase app '${firebaseAppName}'`,
              )
              firebaseFunctionUpdated = true
            } else if (workspace.deletedApps.has(tagValue)) {
              logger.warn(
                `CHANGE ORPHANED firebase function '${firebaseFunctionName}', cannot locate firebase application '${tagValue}'`,
              )
            }
          }

          // update the firebase function name tag if it has been renamed
          // const functionNameTag = getFirebaseScopeFromTag(
          //   firebaseFunctionProject,
          //   'firebase:name',
          // )
          // if (workspace.renamedFunctions.has(functionNameTag.tagValue)) {
          //   const newFunctionName = workspace.renamedFunctions.get(
          //     functionNameTag.tagValue,
          //   ).name
          //   const newFunctionNameTag = `firebase:name:${newFunctionName}`
          //   firebaseFunctionProject.tags[functionNameTag.tagIndex] =
          //     newFunctionNameTag
          //   logger.info(
          //     `CHANGE updated firebase function name tag for firebase function '${firebaseFunctionName}', renamed from '${functionNameTag.tagValue}' to '${newFunctionNameTag}'`,
          //   )

          // need to update the deploy command on the function too
          // const deployCommand =
          //   firebaseFunctionProject.targets.deploy.options.command
          // firebaseFunctionProject.targets.deploy.options.command =
          //   deployCommand.replace(
          //     FUNCTIONS_DEPLOY_MATCHER,
          //     '$1' + newFunctionName,
          //   )
          // logger.info(
          //   `CHANGE updated deploy command for firebase function, renamed from '${functionNameTag.tagValue}' to '${newFunctionName}'`,
          // )

          // firebaseFunctionUpdated = true
          // }
        } else {
          debugInfo(
            `- WARNING: Found implicitDep '${firebaseFunctionName}' that wasnt a firebase function `,
          )
        }

        if (firebaseFunctionUpdated) {
          updateProjectConfiguration(
            tree,
            firebaseFunctionName,
            firebaseFunctionProject,
          )
        }
      })

      // 3. Update firebase.json config for this app if any of its functions have been renamed or deleted
      debugInfo(`- checking for updates to firebase.json`)
      const firebaseConfigName =
        workspace.firebaseAppConfigs.get(firebaseAppName)
      const config = workspace.firebaseConfigs.get(firebaseConfigName)
      // const firebaseConfigName = calculateFirebaseConfigName(
      //   tree,
      //   firebaseAppName in workspace.renamedApps
      //     ? workspace.renamedApps[firebaseAppName]
      //     : firebaseAppName,
      // )

      // const config = readJson<FirebaseConfig>(tree, firebaseConfigName)
      // if (!config) {
      //   throw new Error(
      //     `Could not load firebase config file '${firebaseConfigName}' for firebase app '${firebaseAppName}'`,
      //   )
      // }
      let configUpdated = false

      const functions = config.functions as FirebaseFunction[]
      const updatedFunctions: FirebaseFunction[] = []
      // remove deleted functions
      for (let i = 0; i < functions.length; ++i) {
        const func = functions[i]
        if (workspace.deletedFunctions.has(func.codebase)) {
          logger.info(
            `CHANGE deleted firebase function '${func.codebase}' from '${firebaseConfigName}'`,
          )
          configUpdated = true
        } else {
          updatedFunctions.push(func)
        }
      }

      debugInfo(`- checking for renamed codebases in '${firebaseConfigName}'`)
      debugInfo(`- updatedFunctions=${JSON.stringify(updatedFunctions)}`)

      // update renamed functions
      for (let i = 0; i < updatedFunctions.length; ++i) {
        const func = updatedFunctions[i]
        const codebase = func.codebase
        debugInfo(`- checking if codebase '${codebase}' is renamed`)
        if (workspace.renamedFunctions.has(codebase)) {
          // change name
          const project = workspace.renamedFunctions.get(codebase)

          debugInfo(`- codebase '${codebase}' is renamed to ${project.name}`)

          func.codebase = project.name
          // change source dir
          func.source = project.targets.build.options.outputPath
          logger.info(
            `CHANGE renamed firebase function codebase from '${codebase}' to '${project.name}' in '${firebaseConfigName}'`,
          )
          configUpdated = true
        }
      }
      if (configUpdated) {
        config.functions = updatedFunctions
        writeJson(tree, firebaseConfigName, config)
      }
    },
  )

  // last, detect and warn about orphaned functions (where its parent app has been deleted)
  debugInfo(`- checking for orphaned functions`)
  workspace.firebaseFunctionProjects.forEach(
    (firebaseFunctionProject, firebaseFunctionName) => {
      // for (const firebaseFunctionName in workspace.firebaseFunctionProjects) {
      //   const firebaseFunctionProject =
      //     workspace.firebaseFunctionProjects[firebaseFunctionName]
      const { tagValue } = getFirebaseScopeFromTag(
        firebaseFunctionProject,
        'firebase:dep',
      )
      debugInfo(`- checking for ${tagValue} in firebase apps`)
      debugInfo(
        `- firebaseAppProjects=${mapKeys(workspace.firebaseAppProjects)}`,
      )
      if (!workspace.firebaseAppProjects.has(tagValue)) {
        logger.info(
          `CHANGE orphaned firebase function '${firebaseFunctionName}', cannot locate firebase application '${tagValue}'`,
        )
      }
    },
  )

  return runTasksInSerial(...tasks)
}

export default syncGenerator
