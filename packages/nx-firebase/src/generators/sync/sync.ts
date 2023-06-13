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
  getFirebaseProjects,
  getFirebaseWorkspaceChanges,
  isFirebaseApp,
  updateFirebaseAppDeployProject,
  CONFIG_NO_APP,
  mapKeys,
} from './lib'

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
  // build list of firebase apps and functions in the workspace
  const projects = getFirebaseProjects(tree)
  const changes = getFirebaseWorkspaceChanges(tree, projects)

  logger.info(
    `This workspace has ${projects.firebaseAppProjects.size} firebase apps and ${projects.firebaseFunctionProjects.size} firebase functions\n\n`,
  )

  changes.deletedApps.forEach((deleted, projectName) => {
    logger.info(`  SYNC Firebase app '${projectName}' has been deleted`)
  })
  changes.deletedFunctions.forEach((deleted, projectName) => {
    logger.info(`  SYNC Firebase function '${projectName}' has been deleted`)
  })
  changes.renamedApps.forEach((newProjectName, oldProjectName) => {
    logger.info(
      `  SYNC Firebase app '${newProjectName}' has been renamed from '${oldProjectName}'`,
    )
  })
  changes.renamedFunctions.forEach((newProjectName, oldProjectName) => {
    logger.info(
      `  SYNC Firebase function '${newProjectName}' has been renamed from '${oldProjectName}'`,
    )
  })

  // build lists of firebase apps & functions that have been deleted or renamed
  debugInfo('- Syncing workspace')

  // 1. remove any orphaned firebase config files that no longer linked to an app
  projects.firebaseConfigProjects.forEach((projectName, configName) => {
    if (projectName === CONFIG_NO_APP) {
      debugInfo(`- found firebase config ${configName} with no app`)
      tree.delete(configName)
      // its ok to delete keys in forEach
      projects.firebaseConfigProjects.delete(configName)
      projects.firebaseConfigs.delete(configName)
      // dont need to sync firebaseAppConfigs since this app wont exist in there
      logger.info(
        `CHANGE ${configName} firebase config, deleted as no longer linked to a firebase app`,
      )
    }
  })

  // TODO: rename firebase config files too
  // renamedApps.forEach((projectName, oldProjectName) => {
  //   // rename the config file
  //   // update the --config in the project
  // })

  // 1. Delete firebase config for any deleted apps
  // for (const deletedApp in changes.deletedApps) {
  //   const deletedAppConfigName = calculateFirebaseConfigName(tree, deletedApp)
  //   tree.delete(deletedAppConfigName)
  //   logger.info(
  //     `CHANGE ${deletedApp} app was deleted, removing its firebase config file ${deletedAppConfigName}`,
  //   )
  // }

  // now sync the selected firebase apps
  projects.firebaseAppProjects.forEach(
    (firebaseAppProject, firebaseAppName) => {
      /**
       * Nx automatically:
       * - updates implicitDependencies when projects are renamed with `nx g mv`
       * - deletes implicitDependencies when projects are deleted with `nx g rm`
       * So we do not have to consider these scenarios.
       */

      // 1. update the firebase app name tag if it has been renamed
      let firebaseAppUpdated = false
      const appNameTag = getFirebaseScopeFromTag(
        firebaseAppProject,
        'firebase:name',
      )
      if (changes.renamedApps.has(appNameTag.tagValue)) {
        const newAppNameTag = `firebase:name:${changes.renamedApps.get(
          appNameTag.tagValue,
        )}`
        firebaseAppProject.tags[appNameTag.tagIndex] = newAppNameTag
        logger.info(
          `CHANGE firebase app name tag for renamed firebase app '${firebaseAppName}' from '${appNameTag.tagValue}' to '${newAppNameTag}'`,
        )
        firebaseAppUpdated = true
      }

      if (firebaseAppUpdated) {
        firebaseAppProject.implicitDependencies.sort() // just sort it anyway
        updateProjectConfiguration(tree, firebaseAppName, firebaseAppProject)
      }

      // 2. handle deleted or renamed firebase apps by updating firebase:dep:<name> tags in functions
      // also update the deploy command
      firebaseAppProject.implicitDependencies?.map((firebaseFunctionName) => {
        let firebaseFunctionUpdated = false
        const firebaseFunctionProject =
          projects.firebaseFunctionProjects.get(firebaseFunctionName)
        // only investigate deps that are function projects
        // user might add other deps, or it might be the firebase config
        if (firebaseFunctionProject) {
          const { tagValue, tagIndex } = getFirebaseScopeFromTag(
            firebaseFunctionProject,
            'firebase:dep',
          )
          if (tagValue) {
            if (changes.renamedApps.has(tagValue)) {
              const renamedFunctionName = changes.renamedApps.get(tagValue)
              firebaseFunctionProject.tags[
                tagIndex
              ] = `firebase:dep:${renamedFunctionName}`
              logger.info(
                `CHANGE updated firebase:dep tag in firebase function '${firebaseFunctionName}' from '${tagValue}' to renamed to firebase app '${firebaseAppName}'`,
              )
              firebaseFunctionUpdated = true
            } else if (changes.deletedApps.has(tagValue)) {
              logger.warn(
                `CHANGE ORPHANED firebase function '${firebaseFunctionName}', cannot locate firebase application '${tagValue}'`,
              )
            }
          }

          // update the firebase function name tag if it has been renamed
          const functionNameTag = getFirebaseScopeFromTag(
            firebaseFunctionProject,
            'firebase:name',
          )
          if (changes.renamedFunctions.has(functionNameTag.tagValue)) {
            const newFunctionName = changes.renamedFunctions.get(
              functionNameTag.tagValue,
            )
            const newFunctionNameTag = `firebase:name:${newFunctionName}`
            firebaseFunctionProject.tags[functionNameTag.tagIndex] =
              newFunctionNameTag
            logger.info(
              `CHANGE updated firebase function name tag for firebase function '${firebaseFunctionName}', renamed from '${functionNameTag.tagValue}' to '${newFunctionNameTag}'`,
            )

            // need to update the deploy command on the function too
            const deployCommand =
              firebaseFunctionProject.targets.deploy.options.command
            firebaseFunctionProject.targets.deploy.options.command =
              deployCommand.replace(
                FUNCTIONS_DEPLOY_MATCHER,
                '$1' + newFunctionName,
              )
            logger.info(
              `CHANGE updated deploy command for firebase function, renamed from '${functionNameTag.tagValue}' to '${newFunctionName}'`,
            )

            firebaseFunctionUpdated = true
          }
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
        projects.firebaseAppConfigs.get(firebaseAppName)
      const config = projects.firebaseConfigs.get(firebaseConfigName)
      // const firebaseConfigName = calculateFirebaseConfigName(
      //   tree,
      //   firebaseAppName in changes.renamedApps
      //     ? changes.renamedApps[firebaseAppName]
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
        if (changes.deletedFunctions.has(func.codebase)) {
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
        if (changes.renamedFunctions.has(codebase)) {
          // change name
          const newCodebase = changes.renamedFunctions.get(codebase)

          debugInfo(`- codebase '${codebase}' is renamed to ${newCodebase}`)

          func.codebase = newCodebase
          // change source dir
          const project = projects.firebaseFunctionProjects.get(newCodebase)
          func.source = project.targets.build.options.outputPath
          logger.info(
            `CHANGE renamed firebase function codebase from '${codebase}' to '${newCodebase}' in '${firebaseConfigName}'`,
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
  projects.firebaseFunctionProjects.forEach(
    (firebaseFunctionProject, firebaseFunctionName) => {
      // for (const firebaseFunctionName in projects.firebaseFunctionProjects) {
      //   const firebaseFunctionProject =
      //     projects.firebaseFunctionProjects[firebaseFunctionName]
      const { tagValue } = getFirebaseScopeFromTag(
        firebaseFunctionProject,
        'firebase:dep',
      )
      debugInfo(`- checking for ${tagValue} in firebase apps`)
      debugInfo(
        `- firebaseAppProjects=${mapKeys(projects.firebaseAppProjects)}`,
      )
      if (!projects.firebaseAppProjects.has(tagValue)) {
        logger.info(
          `CHANGE orphaned firebase function '${firebaseFunctionName}', cannot locate firebase application '${tagValue}'`,
        )
      }
    },
  )

  return runTasksInSerial(...tasks)
}

export default syncGenerator
