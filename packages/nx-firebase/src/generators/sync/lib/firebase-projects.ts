import {
  ProjectConfiguration,
  TargetConfiguration,
  Tree,
  getProjects,
  logger,
  readJson,
} from '@nx/devkit'

import { calculateFirebaseConfigName, FirebaseFunction } from '../../../utils'

import { SyncGeneratorSchema } from '../schema'
import { debugInfo } from './debug'
import { getFirebaseScopeFromTag } from './tags'

export function isFirebaseApp(project: ProjectConfiguration) {
  return project.tags?.includes('firebase:app')
}

export function isFirebaseFunction(project: ProjectConfiguration) {
  return project.tags?.includes('firebase:function')
}

export interface FirebaseProjects {
  firebaseAppProjects: Record<string, ProjectConfiguration>
  firebaseFunctionProjects: Record<string, ProjectConfiguration>
}

export interface FirebaseWorkspaceChanges {
  // map of project name -> deletion status
  deletedApps: Record<string, boolean>
  deletedFunctions: Record<string, boolean>
  // map of previous name -> new name
  renamedApps: Record<string, string>
  renamedFunctions: Record<string, string>
}

/**
 * Scan the workspace, identifying firebase projects managed by this plugin by their tags:
 * - firebase:app
 * - firebase:function
 * @param tree - host workspace
 * @returns FirebaseProjects object
 */
export function getFirebaseProjects(tree: Tree): FirebaseProjects {
  const projects = getProjects(tree)
  const firebaseAppProjects: Record<string, ProjectConfiguration> = {}
  const firebaseFunctionProjects: Record<string, ProjectConfiguration> = {}

  debugInfo('- building list of firebase apps & functions')

  for (const p of projects) {
    const projectName = p[0]
    const project = p[1]
    if (isFirebaseApp(project)) {
      firebaseAppProjects[projectName] = project
    }
    if (isFirebaseFunction(project)) {
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

  return {
    firebaseAppProjects,
    firebaseFunctionProjects,
  }
}

export function getFirebaseWorkspaceChanges(
  tree: Tree,
  projects: FirebaseProjects,
): FirebaseWorkspaceChanges {
  // map of project name -> deletion status
  const deletedApps: Record<string, boolean> = {}
  const deletedFunctions: Record<string, boolean> = {}
  // map of previous name -> new name
  const renamedApps: Record<string, string> = {}
  const renamedFunctions: Record<string, string> = {}

  // determine deleted functions
  debugInfo(`- checking apps for deleted function deps`)
  for (const firebaseAppProjectName in projects.firebaseAppProjects) {
    const firebaseAppProject =
      projects.firebaseAppProjects[firebaseAppProjectName]
    firebaseAppProject.implicitDependencies?.map((dep) => {
      if (!(dep in projects.firebaseFunctionProjects)) {
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
      if (!(funcName in projects.firebaseFunctionProjects)) {
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
  for (const firebaseFunctionName in projects.firebaseFunctionProjects) {
    const firebaseFunctionProject =
      projects.firebaseFunctionProjects[firebaseFunctionName]
    const { tagValue } = getFirebaseScopeFromTag(
      firebaseFunctionProject,
      'firebase:dep',
    )
    if (!(tagValue in projects.firebaseAppProjects)) {
      debugInfo(
        `- function ${firebaseFunctionName} points to app ${tagValue} which doesnt exist, so app must be deleted`,
      )

      deletedApps[tagValue] = true
    }
  }

  debugInfo(`checking for renamed apps`)

  // determine renamed apps
  for (const firebaseAppProjectName in projects.firebaseAppProjects) {
    const firebaseAppProject =
      projects.firebaseAppProjects[firebaseAppProjectName]
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
  for (const firebaseFunctionName in projects.firebaseFunctionProjects) {
    const firebaseFunctionProject =
      projects.firebaseFunctionProjects[firebaseFunctionName]
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

  return {
    deletedApps,
    deletedFunctions,
    renamedApps,
    renamedFunctions,
  }
}

/**
 * Rewrite the firebase deploy command for the given function deploy target
 *  to either add or update the --project cli parameter
 * @param target - deploy target in the function
 * @param options -
 */
export function updateFirebaseAppDeployProject(
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
