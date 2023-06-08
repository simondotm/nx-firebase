import {
  formatFiles,
  GeneratorCallback,
  getProjects,
  logger,
  ProjectConfiguration,
  readJson,
  readProjectConfiguration,
  runTasksInSerial,
  TargetConfiguration,
  Tree,
  updateJson,
  updateProjectConfiguration,
  writeJson,
} from '@nx/devkit'

import { SyncGeneratorSchema } from './schema'
import {
  calculateFirebaseConfigName,
  FirebaseConfig,
  FirebaseFunction,
  generateFirebaseConfigName,
} from '../../utils'
import initGenerator from '../init/init'

function debugInfo(info: string) {
  //  logger.info(info)
}

function updateFirebaseAppDeployProject(
  target: TargetConfiguration,
  options: SyncGeneratorSchema,
) {
  const command: string = target.options.command
  if (command.includes('firebase deploy')) {
    debugInfo('- found deploy command')
    debugInfo(`- command=${command}`)
    if (command.includes('--project')) {
      debugInfo('- found --project in deploy command')
      // already set, so update
      target.options.command = command.replace(
        /(--project[ =])([A-Z0-9a-z-_]+)/,
        '$1' + options.project,
      )
      debugInfo(`- new command: ${target.options.command}`)

      logger.info(
        `  SYNC updating firebase deploy project for '${options.app}' to '--project=${options.project}'`,
      )
      return true
    } else {
      debugInfo('- did not find --project in deploy command')

      // no set, so add
      target.options.command = command.replace(
        /(firebase deploy)/,
        '$1' + ' ' + `--project=${options.project}`,
      )
      debugInfo(`- new command: ${target.options.command}`)
      logger.info(
        `  SYNC setting firebase deploy project for '${options.app}' to '--project=${options.project}'`,
      )
      return true
    }
  }
  return false
}

// for specific or all apps
// if firebase app is renamed - all dependent functions need to be re-tagged.

// for each specific or all apps
// if firebase app is deleted - all functions are orphaned
//
//  find all firebase function apps that are matched to app
//   run through implicit deps
//

// if firebase function is renamed - app deps & firebase.json need to be updated
// if firebase function is deleted - app deps & firebase.json need to be updated

// should sync be workspace or per app or per function?
// sync (all apps & workspaces)
// sync --functions (just workspace functions)
// sync --app=<app> [--functions] [--project=xxx] (specific app)

// dont need the functions flags, we'll always sync those

function getFirebaseScopeFromTag(project: ProjectConfiguration, scope: string) {
  const tags = project.tags
  let foundTag = false
  if (tags) {
    for (let i = 0; i < tags.length; ++i) {
      const tag = tags[i]
      if (tag.includes(scope)) {
        foundTag = true
        const scopes = tag.split(':')
        if (scopes.length === 3) {
          return { tagValue: scopes[2], tagIndex: i }
        } else {
          logger.error(
            `Malformed '${scope}' tag in project '${project.name}', expected '${scope}:<value>', found '${tag}'.`,
          )
        }
      }
    }
  }
  if (!foundTag) {
    logger.error(
      `Project '${project.name}' has a missing '${scope}' tag in project.`,
    )
  }
  return undefined
}

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
    debugInfo(`changing project for ${options.app} to ${options.project}`)
    const project = readProjectConfiguration(tree, options.app)
    if (!project.tags || project.tags.includes['firebase:app']) {
      throw new Error(`Project '${options.app}' is not a Firebase application.`)
    }
    if (updateFirebaseAppDeployProject(project.targets.deploy, options)) {
      updateProjectConfiguration(tree, options.app, project)
    }
    return
  }

  // otherwise sync either all or one specific firebase app project

  // build list of firebase apps and functions in the workspace
  const projects = getProjects(tree)
  let firebaseAppProjects: Record<string, ProjectConfiguration> = {}
  const firebaseFunctionProjects: Record<string, ProjectConfiguration> = {}

  debugInfo('- building list of firebase apps & functions')

  //   debugInfo(JSON.stringify(tree))
  //   debugInfo(`projects=${JSON.stringify(projects)}`)

  for (const p of projects) {
    const projectName = p[0]
    const project = p[1] //projects[projectName]
    const tags = project.tags

    debugInfo(`- checking project ${projectName} tags=${JSON.stringify(tags)}`)

    if (tags.includes('firebase:app')) {
      debugInfo(`- found firebase app ${projectName}`)
      firebaseAppProjects[projectName] = project
    }
    if (tags.includes('firebase:function')) {
      debugInfo(`- found firebase function ${projectName}`)
      firebaseFunctionProjects[projectName] = project
    }
  }

  debugInfo(
    `- firebaseAppProjects=${JSON.stringify(Object.keys(firebaseAppProjects))}`,
  )
  debugInfo(
    `- firebaseFunctionProjects=${JSON.stringify(
      Object.keys(firebaseFunctionProjects),
    )}`,
  )

  // if a single application has been specified for sync,
  // filter the list of firebase app projects to be processed
  if (options.app) {
    if (options.app in firebaseAppProjects) {
      firebaseAppProjects = {
        [options.app]: firebaseAppProjects[options.app],
      }
    } else {
      throw new Error(`Project '${options.app}' is not a Firebase application.`)
    }
  }

  // build lists of firebase apps & functions that have been deleted or renamed
  debugInfo('- Syncing workspace')

  // map of project name -> deletion status
  const deletedApps: Record<string, boolean> = {}
  const deletedFunctions: Record<string, boolean> = {}
  // map of previous name -> new name
  const renamedApps: Record<string, string> = {}
  const renamedFunctions: Record<string, string> = {}

  // determine deleted functions
  debugInfo(`- checking apps for deleted function deps`)
  for (const firebaseAppProjectName in firebaseAppProjects) {
    const firebaseAppProject = firebaseAppProjects[firebaseAppProjectName]
    firebaseAppProject.implicitDependencies?.map((dep) => {
      if (!(dep in firebaseFunctionProjects)) {
        debugInfo(
          `- function ${dep} is a dep, but cannot be located so deleted`,
        )
        deletedFunctions[dep] = true
      }
    })
    //TODO: functions may also be removed using nx g rm <function> --forceRemove
    // which removes the implicitDep, but doesnt update the firebase config
    // so we need to check the firebase config too, and determine any projects that are in there
    // but not in the workspace and mark them as deleted

    const firebaseConfigName = calculateFirebaseConfigName(
      tree,
      firebaseAppProjectName,
    )

    debugInfo(
      `- checking config ${firebaseConfigName} to see if it contains a function that doesnt exist`,
    )

    const config = readJson(tree, firebaseConfigName)
    const functions = config.functions as FirebaseFunction[]
    // remove deleted functions
    for (let i = 0; i < functions.length; ++i) {
      const func = functions[i]
      const funcName = func.codebase
      if (!(funcName in firebaseFunctionProjects)) {
        debugInfo(
          `- function ${funcName} is in config ${firebaseConfigName}, but cannot be located so function must be deleted`,
        )

        deletedFunctions[funcName] = true
      }
    }
  }

  debugInfo(`- checking functions for deleted apps`)

  // nx g mv --project=source --destination=dstname
  // DOES update implicitDeps
  // Again, this means implicitDep wont be wrong, but we cant use it to detect renames
  // This is ok though because we detect renamed functions via tags

  // determine deleted apps
  for (const firebaseFunctionName in firebaseFunctionProjects) {
    const firebaseFunctionProject =
      firebaseFunctionProjects[firebaseFunctionName]
    const { tagValue } = getFirebaseScopeFromTag(
      firebaseFunctionProject,
      'firebase:app',
    )
    if (!(tagValue in firebaseAppProjects)) {
      debugInfo(
        `- function ${firebaseFunctionName} points to app ${tagValue} which doesnt exist, so app must be deleted`,
      )

      deletedApps[tagValue] = true
    }
  }

  debugInfo(`checking for renamed apps`)

  // determine renamed apps
  for (const firebaseAppProjectName in firebaseAppProjects) {
    const firebaseAppProject = firebaseAppProjects[firebaseAppProjectName]
    const { tagValue } = getFirebaseScopeFromTag(
      firebaseAppProject,
      'firebase:name',
    )
    if (tagValue && tagValue !== firebaseAppProject.name) {
      debugInfo(
        `- app ${tagValue} has been renamed to ${firebaseAppProject.name} `,
      )

      renamedApps[tagValue] = firebaseAppProject.name
      // it might have been flagged as deleted earlier, but was actually renamed, so remove from deleted list
      delete deletedApps[tagValue]
    }
  }

  debugInfo(`- checking for renamed functions`)

  // determine renamed functions
  for (const firebaseFunctionName in firebaseFunctionProjects) {
    const firebaseFunctionProject =
      firebaseFunctionProjects[firebaseFunctionName]
    const { tagValue } = getFirebaseScopeFromTag(
      firebaseFunctionProject,
      'firebase:name',
    )
    if (tagValue && tagValue !== firebaseFunctionProject.name) {
      debugInfo(
        `- function ${tagValue} has been renamed to ${firebaseFunctionProject.name} `,
      )

      renamedFunctions[tagValue] = firebaseFunctionProject.name
      // it might have been flagged as deleted earlier, but was actually renamed, so remove from deleted list
      delete deletedFunctions[tagValue]
    }
  }

  debugInfo(`- deletedApps=${JSON.stringify(Object.keys(deletedApps))}`)
  debugInfo(
    `- deletedFunctions=${JSON.stringify(Object.keys(deletedFunctions))}`,
  )
  debugInfo(`- renamedApps=${JSON.stringify(Object.keys(renamedApps))}`)
  debugInfo(
    `- renamedFunctions=${JSON.stringify(Object.keys(renamedFunctions))}`,
  )

  // now sync the selected firebase apps
  for (const firebaseAppName in firebaseAppProjects) {
    const firebaseAppProject = firebaseAppProjects[firebaseAppName]
    // const implicitDependencies: string[] = []

    // what if function renamed AND app is renamed?
    let firebaseAppUpdated = false

    // Nx automatically:
    //  - updates implicitDependencies when projects are renamed
    //  - deletes implicitDependencies when projects are deleted

    // // 1. handle deleted or renamed functions in the app by rewriting app implicit dependencies
    //   debugInfo(`- checking for renamed app dependencies`)
    // firebaseAppProject.implicitDependencies?.map((dep) => {
    //     debugInfo(`- checking if app dependency '${dep}' is renamed`)
    //   if (dep in renamedFunctions) {
    //       debugInfo(`- app dependency '${dep}' is renamed`)
    //     const renamedDep = renamedFunctions[dep]
    //     implicitDependencies.push(renamedDep)
    //     logger.info(
    //       `  SYNC firebase app '${firebaseAppName}' dependency for firebase function renamed from '${dep}' to '${renamedDep}'`,
    //     )
    //     firebaseAppUpdated = true
    //   } else if (dep in deletedFunctions) {
    //     logger.info(
    //       `  SYNC removed firebase app '${firebaseAppName}' dependency for deleted firebase function '${dep}'`,
    //     )
    //     firebaseAppUpdated = true
    //   } else {
    //     implicitDependencies.push(dep)
    //   }
    // })

    // 2. update the firebase app name tag if it has been renamed
    const appNameTag = getFirebaseScopeFromTag(
      firebaseAppProject,
      'firebase:name',
    )
    if (appNameTag.tagValue in renamedApps) {
      const newAppNameTag = `firebase:name:${renamedApps[appNameTag.tagValue]}`
      firebaseAppProject.tags[appNameTag.tagIndex] = newAppNameTag
      logger.info(
        `  SYNC firebase app name tag for renamed firebase app '${firebaseAppName}' from '${appNameTag.tagValue}' to '${newAppNameTag}'`,
      )
      firebaseAppUpdated = true
    }

    if (firebaseAppUpdated) {
      //firebaseAppProject.implicitDependencies = implicitDependencies.sort()
      firebaseAppProject.implicitDependencies.sort()
      updateProjectConfiguration(tree, firebaseAppName, firebaseAppProject)
    }

    // 2. handle deleted or renamed firebase apps by updating firebase:app:<name> tags in functions
    // also update the deploy command
    firebaseAppProject.implicitDependencies?.map((firebaseFunctionName) => {
      let firebaseFunctionUpdated = false
      const firebaseFunctionProject =
        firebaseFunctionProjects[firebaseFunctionName]
      const { tagValue, tagIndex } = getFirebaseScopeFromTag(
        firebaseFunctionProject,
        'firebase:app',
      )
      if (tagValue) {
        if (tagValue in renamedApps) {
          const renamedFunctionName = renamedApps[tagValue]
          firebaseFunctionProject.tags[
            tagIndex
          ] = `firebase:app:${renamedFunctionName}`
          logger.info(
            `  SYNC updated firebase:app tag in firebase function '${firebaseFunctionName}' from '${tagValue}' to renamed to firebase app '${firebaseAppName}'`,
          )
          firebaseFunctionUpdated = true
        } else if (tagValue in deletedApps) {
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
      if (functionNameTag.tagValue in renamedFunctions) {
        const newFunctionName = renamedFunctions[functionNameTag.tagValue]
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
      if (func.codebase in deletedFunctions) {
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
      if (funcName in renamedFunctions) {
        // change name
        const newFuncName = renamedFunctions[funcName]
        func.codebase = newFuncName
        // change source dir
        const project = firebaseFunctionProjects[newFuncName]
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

  // last, detect and warn about orphaned functions (where app has been deleted)
  debugInfo(`- checking for orphaned functions`)
  for (const firebaseFunctionName in firebaseFunctionProjects) {
    const firebaseFunctionProject =
      firebaseFunctionProjects[firebaseFunctionName]
    const { tagValue } = getFirebaseScopeFromTag(
      firebaseFunctionProject,
      'firebase:app',
    )
    debugInfo(`checking for ${tagValue} in deleted Apps`)
    if (tagValue && tagValue in deletedApps) {
      logger.info(
        `  SYNC orphaned firebase function '${firebaseFunctionName}', cannot locate firebase application '${tagValue}'`,
      )
    }
  }

  return runTasksInSerial(...tasks)
}

export default syncGenerator
