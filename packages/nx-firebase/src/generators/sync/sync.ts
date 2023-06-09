import {
  GeneratorCallback,
  logger,
  readJson,
  readProjectConfiguration,
  runTasksInSerial,
  Tree,
  updateProjectConfiguration,
  writeJson,
} from '@nx/devkit'

import { SyncGeneratorSchema } from './schema'
import {
  calculateFirebaseConfigName,
  FirebaseConfig,
  FirebaseFunction,
} from '../../utils'
import initGenerator from '../init/init'
import { getFirebaseScopeFromTag } from './lib'
import { debugInfo } from './lib/debug'
import {
  getFirebaseProjects,
  getFirebaseWorkspaceChanges,
  isFirebaseApp,
  updateFirebaseAppDeployProject,
} from './lib/firebase-projects'

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
    debugInfo(`changing project for ${options.app} to ${options.project}`)
    if (updateFirebaseAppDeployProject(project.targets.deploy, options)) {
      updateProjectConfiguration(tree, options.app, project)
    }
    return
  }

  // otherwise, sync the workspace.
  // build list of firebase apps and functions in the workspace
  // const workspace = getAllFirebaseProjects(tree)
  const projects = getFirebaseProjects(tree)
  const changes = getFirebaseWorkspaceChanges(tree, projects)

  // build lists of firebase apps & functions that have been deleted or renamed
  debugInfo('- Syncing workspace')

  // now sync the selected firebase apps
  for (const firebaseAppName in projects.firebaseAppProjects) {
    const firebaseAppProject = projects.firebaseAppProjects[firebaseAppName]

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
    if (appNameTag.tagValue in changes.renamedApps) {
      const newAppNameTag = `firebase:name:${
        changes.renamedApps[appNameTag.tagValue]
      }`
      firebaseAppProject.tags[appNameTag.tagIndex] = newAppNameTag
      logger.info(
        `  SYNC firebase app name tag for renamed firebase app '${firebaseAppName}' from '${appNameTag.tagValue}' to '${newAppNameTag}'`,
      )
      firebaseAppUpdated = true
    }

    if (firebaseAppUpdated) {
      firebaseAppProject.implicitDependencies.sort()
      updateProjectConfiguration(tree, firebaseAppName, firebaseAppProject)
    }

    // 2. handle deleted or renamed firebase apps by updating firebase:app:<name> tags in functions
    // also update the deploy command
    firebaseAppProject.implicitDependencies?.map((firebaseFunctionName) => {
      let firebaseFunctionUpdated = false
      const firebaseFunctionProject =
        projects.firebaseFunctionProjects[firebaseFunctionName]
      const { tagValue, tagIndex } = getFirebaseScopeFromTag(
        firebaseFunctionProject,
        'firebase:app',
      )
      if (tagValue) {
        if (tagValue in changes.renamedApps) {
          const renamedFunctionName = changes.renamedApps[tagValue]
          firebaseFunctionProject.tags[
            tagIndex
          ] = `firebase:app:${renamedFunctionName}`
          logger.info(
            `  SYNC updated firebase:app tag in firebase function '${firebaseFunctionName}' from '${tagValue}' to renamed to firebase app '${firebaseAppName}'`,
          )
          firebaseFunctionUpdated = true
        } else if (tagValue in changes.deletedApps) {
          logger.warn(
            `  SYNC ORPHANED firebase function '${firebaseFunctionName}', cannot locate firebase application '${tagValue}'`,
          )
        }
      }

      // update the firebase function name tag if it has been renamed
      const functionNameTag = getFirebaseScopeFromTag(
        firebaseFunctionProject,
        'firebase:name',
      )
      if (functionNameTag.tagValue in changes.renamedFunctions) {
        const newFunctionName =
          changes.renamedFunctions[functionNameTag.tagValue]
        const newFunctionNameTag = `firebase:name:${newFunctionName}`
        firebaseFunctionProject.tags[functionNameTag.tagIndex] =
          newFunctionNameTag
        logger.info(
          `  SYNC updated firebase function name tag for firebase function '${firebaseFunctionName}', renamed from '${functionNameTag.tagValue}' to '${newFunctionNameTag}'`,
        )

        // need to update the deploy command on the function too
        const deployCommand =
          firebaseFunctionProject.targets.deploy.options.command
        const regex = /(--only[ =]functions:)([A-Za-z-]+)/
        firebaseFunctionProject.targets.deploy.options.command =
          deployCommand.replace(regex, '$1' + newFunctionName)
        logger.info(
          `  SYNC updated deploy command for firebase function, renamed from '${functionNameTag.tagValue}' to '${newFunctionName}'`,
        )

        firebaseFunctionUpdated = true
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
    const firebaseConfigName = calculateFirebaseConfigName(
      tree,
      firebaseAppName,
    )

    const config = readJson<FirebaseConfig>(tree, firebaseConfigName)
    let configUpdated = false

    const functions = config.functions as FirebaseFunction[]
    const updatedFunctions: FirebaseFunction[] = []
    // remove deleted functions
    for (let i = 0; i < functions.length; ++i) {
      const func = functions[i]
      if (func.codebase in changes.deletedFunctions) {
        logger.info(
          `  SYNC deleted firebase function '${func.codebase}' from '${firebaseConfigName}'`,
        )
        configUpdated = true
      } else {
        updatedFunctions.push(func)
      }
    }
    // update renamed functions
    for (let i = 0; i < updatedFunctions.length; ++i) {
      const func = updatedFunctions[i]
      const funcName = func.codebase
      if (funcName in changes.renamedFunctions) {
        // change name
        const newFuncName = changes.renamedFunctions[funcName]
        func.codebase = newFuncName
        // change source dir
        const project = projects.firebaseFunctionProjects[newFuncName]
        func.source = project.targets.build.options.outputPath
        logger.info(
          `  SYNC renamed firebase function codebase from '${funcName}' to '${newFuncName}' in '${firebaseConfigName}'`,
        )
        configUpdated = true
      }
    }
    if (configUpdated) {
      config.functions = updatedFunctions
      writeJson(tree, firebaseConfigName, config)
    }
  }

  // last, detect and warn about orphaned functions (where its parent app has been deleted)
  debugInfo(`- checking for orphaned functions`)
  for (const firebaseFunctionName in projects.firebaseFunctionProjects) {
    const firebaseFunctionProject =
      projects.firebaseFunctionProjects[firebaseFunctionName]
    const { tagValue } = getFirebaseScopeFromTag(
      firebaseFunctionProject,
      'firebase:app',
    )
    debugInfo(`checking for ${tagValue} in deleted Apps`)
    if (tagValue && tagValue in changes.deletedApps) {
      logger.info(
        `  SYNC orphaned firebase function '${firebaseFunctionName}', cannot locate firebase application '${tagValue}'`,
      )
    }
  }

  return runTasksInSerial(...tasks)
}

export default syncGenerator
