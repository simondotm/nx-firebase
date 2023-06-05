import {
  formatFiles,
  getProjects,
  logger,
  ProjectConfiguration,
  readJson,
  readProjectConfiguration,
  Tree,
  updateJson,
  updateProjectConfiguration,
} from '@nx/devkit'

import { SyncGeneratorSchema } from './schema'
import {
  FirebaseConfig,
  FirebaseFunction,
  generateFirebaseConfigName,
} from '../../utils'

function updateFirebaseAppDeployProject(
  parent: Record<string, string>,
  options: SyncGeneratorSchema,
) {
  for (const key in parent) {
    if (typeof key === 'object') {
      updateFirebaseAppDeployProject(
        parent.key as unknown as Record<string, string>,
        options,
      )
    } else {
      // check for --project updates
      const v = parent[key]
      if (v.includes('firebase deploy')) {
        if (v.includes('--project')) {
          // already set, so update
          const regex = /(--profile[ =])([A-Za-z-]+)/
          v.replace(regex, '$1' + options.project)
        } else {
          // no set, so add
          const regex = /(firebase deploy)/
          v.replace(regex, '$1' + ' ' + `--deploy=${options.project}`)
        }
      }
    }
  }
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

export default async function (tree: Tree, options: SyncGeneratorSchema) {
  // change the firebase project for an nx firebase app project
  if (options.project) {
    const project = readProjectConfiguration(tree, options.app)
    if (!project.tags || project.tags.includes['firebase:app']) {
      throw new Error(`Project '${options.app}' is not a Firebase application.`)
    }

    const deploy = project.targets.deploy as Record<string, string>
    updateFirebaseAppDeployProject(deploy, options)

    updateProjectConfiguration(tree, options.app, project)
    return
  }

  // otherwise sync either all or one specific firebase app project

  // build list of firebase apps and functions in the workspace
  const projects = getProjects(tree)
  let firebaseAppProjects: Record<string, ProjectConfiguration> = {}
  const firebaseFunctionProjects: Record<string, ProjectConfiguration> = {}

  console.log('building list of firebase apps & functions')

  console.log(JSON.stringify(tree))
  console.log(`projects=${JSON.stringify(projects)}`)

  for (const projectName in projects) {
    const project = projects[projectName]
    const tags = project.tags

    console.log(`checking project ${projectName} tags=${JSON.stringify(tags)}`)

    if (tags.includes['firebase:app']) {
      firebaseAppProjects[projectName] = project
    }
    if (tags.includes['firebase:function']) {
      firebaseFunctionProjects[projectName] = project
    }
  }

  console.log(`firebaseAppProjects=${JSON.stringify(firebaseAppProjects)}`)
  console.log(
    `firebaseFunctionProjects=${JSON.stringify(firebaseFunctionProjects)}`,
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
  console.log('Syncing workspace')

  // map of project name -> deletion status
  const deletedApps: Record<string, boolean> = {}
  const deletedFunctions: Record<string, boolean> = {}
  // map of previous name -> new name
  const renamedApps: Record<string, string> = {}
  const renamedFunctions: Record<string, string> = {}

  // determine deleted functions
  console.log(`checking apps for deleted function deps`)
  for (const firebaseAppProjectName in firebaseAppProjects) {
    const firebaseAppProject = firebaseAppProjects[firebaseAppProjectName]
    for (const dep of firebaseAppProject.implicitDependencies) {
      if (!(dep in firebaseFunctionProjects)) {
        console.log(
          `function ${dep} is a dep, but cannot be located so deleted`,
        )
        deletedFunctions[dep] = true
      }
    }
    //TODO: functions may also be removed using nx g rm <function> --forceRemove
    // which removes the implicitDep, but doesnt update the firebase config
    // so we need to check the firebase config too, and determine any projects that are in there
    // but not in the workspace and mark them as deleted

    const firebaseConfigName = generateFirebaseConfigName(
      tree,
      firebaseAppProjectName,
    )

    console.log(
      `checking config ${firebaseConfigName} to see if it contains a function that doesnt exist`,
    )

    const config = readJson(tree, firebaseConfigName)
    const functions = config.functions as FirebaseFunction[]
    // remove deleted functions
    for (let i = 0; i < functions.length; ++i) {
      const func = functions[i]
      const funcName = func.codebase
      if (!(funcName in firebaseFunctionProjects)) {
        console.log(
          `function ${funcName} is in config ${firebaseConfigName}, but cannot be located so function must be deleted`,
        )

        deletedFunctions[funcName] = true
      }
    }
  }

  console.log(`checking functions for deleted apps`)

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
      console.log(
        `function ${firebaseFunctionName} points to app ${tagValue} which doesnt exist, so app must be deleted`,
      )

      deletedApps[tagValue] = true
    }
  }

  console.log(`checking for renamed apps`)

  // determine renamed apps
  for (const firebaseAppProjectName in firebaseAppProjects) {
    const firebaseAppProject = firebaseAppProjects[firebaseAppProjectName]
    const { tagValue } = getFirebaseScopeFromTag(
      firebaseAppProject,
      'firebase:name',
    )
    if (tagValue && tagValue !== firebaseAppProject.name) {
      console.log(
        `app ${tagValue} has been renamed to ${firebaseAppProject.name} `,
      )

      renamedApps[tagValue] = firebaseAppProject.name
      // it might have been flagged as deleted earlier, but was actually renamed, so remove from deleted list
      delete deletedApps[tagValue]
    }
  }

  console.log(`checking for renamed functions`)

  // determine renamed functions
  for (const firebaseFunctionName in firebaseFunctionProjects) {
    const firebaseFunctionProject =
      firebaseFunctionProjects[firebaseFunctionName]
    const { tagValue } = getFirebaseScopeFromTag(
      firebaseFunctionProject,
      'firebase:name',
    )
    if (tagValue && tagValue !== firebaseFunctionProject.name) {
      console.log(
        `function ${tagValue} has been renamed to ${firebaseFunctionProject.name} `,
      )

      renamedFunctions[tagValue] = firebaseFunctionProject.name
      // it might have been flagged as deleted earlier, but was actually renamed, so remove from deleted list
      delete deletedFunctions[tagValue]
    }
  }

  console.log(`deletedApps=${JSON.stringify(deletedApps)}`)
  console.log(`deletedFunctions=${JSON.stringify(deletedFunctions)}`)
  console.log(`renamedApps=${JSON.stringify(renamedApps)}`)
  console.log(`renamedFunctions=${JSON.stringify(renamedFunctions)}`)

  // now sync the selected firebase apps
  for (const firebaseAppName in firebaseAppProjects) {
    const firebaseAppProject = firebaseAppProjects[firebaseAppName]
    const implicitDependencies: string[] = []

    // what if function renamed AND app is renamed?

    // 1. handle deleted or renamed functions in the app by updating app implicit dependencies
    for (const dep of firebaseAppProject.implicitDependencies) {
      if (dep in renamedFunctions) {
        const renamedDep = renamedFunctions[dep]
        implicitDependencies.push(renamedDep)
        logger.info(
          `UPDATED firebase app '${firebaseAppName}' dependency for firebase function renamed from '${dep}' to '${renamedDep}'`,
        )
      } else if (dep in deletedFunctions) {
        logger.info(
          `REMOVED firebase app '${firebaseAppName}' dependency for deleted firebase function '${dep}'`,
        )
      } else {
        implicitDependencies.push(dep)
      }
    }
    // update the firebase app name tag if it has been renamed
    const appNameTag = getFirebaseScopeFromTag(
      firebaseAppProject,
      'firebase:name',
    )
    if (appNameTag.tagValue in renamedApps) {
      const newAppNameTag = `firebase:name:${
        renamedFunctions[appNameTag.tagValue]
      }`
      firebaseAppProject.tags[appNameTag.tagIndex] = newAppNameTag
      logger.info(
        `UPDATED firebase app name tag for renamed firebase app '${firebaseAppName}' from '${appNameTag.tagValue}' to '${newAppNameTag}'`,
      )
    }
    firebaseAppProject.implicitDependencies = implicitDependencies.sort()
    updateProjectConfiguration(tree, firebaseAppName, firebaseAppProject)

    // 2. handle deleted or renamed firebase apps by updating firebase:app:<name> tags in functions
    // also update the deploy command
    firebaseAppProject.implicitDependencies.map((firebaseFunctionName) => {
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
            `UPDATED firebase app tag in firebase function '${firebaseFunctionName}' for firebase app '${tagValue}' renamed to firebase app '${firebaseAppName}'`,
          )
        } else if (tagValue in deletedApps) {
          logger.warn(
            `ORPHANED firebase function '${firebaseFunctionName}', cannot locate firebase application '${tagValue}'`,
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
          `UPDATED firebase function name tag for firebase function '${firebaseFunctionName}', renamed from '${functionNameTag.tagValue}' to '${newFunctionNameTag}'`,
        )

        // need to update the deploy command on the function too
        const deployCommand =
          firebaseFunctionProject.targets.build.options.command
        const regex = /(--only[ =]functions:)([A-Za-z-]+)/
        firebaseFunctionProject.targets.build.options.command =
          deployCommand.replace(regex, '$1' + newFunctionName)
        logger.info(
          `UPDATED deploy command for firebase function, renamed from '${firebaseFunctionName}' to '${newFunctionName}'`,
        )
      }

      updateProjectConfiguration(
        tree,
        firebaseFunctionName,
        firebaseFunctionProject,
      )
    })

    // 3. Update firebase.json config for this app if any of its functions have been renamed or deleted
    const firebaseConfigName = generateFirebaseConfigName(tree, firebaseAppName)
    updateJson(tree, firebaseConfigName, (config: FirebaseConfig) => {
      const functions = config.functions as FirebaseFunction[]
      const updatedFunctions: FirebaseFunction[] = []
      // remove deleted functions
      for (let i = 0; i < functions.length; ++i) {
        const func = functions[i]
        if (func.codebase in deletedFunctions) {
          logger.info(
            `REMOVED deleted firebase function '${func.codebase}' from '${firebaseConfigName}'`,
          )
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
            `UPDATED renamed firebase function codebase from '${funcName}' to '${newFuncName} in '${firebaseConfigName}'`,
          )
        }
      }
      return config
    })
  }
}
