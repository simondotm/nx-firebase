import { ProjectConfiguration, Tree } from '@nx/devkit'

import { FirebaseFunction } from '../../../utils'

import { debugInfo, mapKeys } from './debug'
import { getFirebaseScopeFromTag } from './tags'
import { FirebaseProjects, FirebaseChanges, FirebaseConfigs } from './types'

/**
 * Check if the given firebase project has been renamed by checking its `firebase:name` tag
 * @param project - Firebase project to be checked
 * @returns the previous project name if renamed, otherwise undefined/falsy
 */
function isRenamed(project: ProjectConfiguration): string | undefined {
  const { tagValue } = getFirebaseScopeFromTag(project, 'firebase:name')
  debugInfo(
    `- checking if project ${project.name} is renamed, will be different to ${tagValue}`,
  )
  if (tagValue !== project.name) {
    debugInfo(
      `- firebase project ${tagValue} has been renamed to ${project.name} `,
    )
    return tagValue
  }
  return undefined
}

export function getFirebaseChanges(
  tree: Tree,
  projects: FirebaseProjects,
  configs: FirebaseConfigs,
): FirebaseChanges {
  // map of project name -> deletion status
  const deletedApps = new Map<string, boolean>()
  const deletedFunctions = new Map<string, boolean>()
  // map of previous name -> new name
  const renamedApps = new Map<string, ProjectConfiguration>()
  const renamedFunctions = new Map<string, ProjectConfiguration>()

  // 1. determine renamed apps using the firebase:name tag
  function checkRenamedProject(
    project: ProjectConfiguration,
    renamedCollection: Map<string, ProjectConfiguration>,
  ) {
    const renamedProject = isRenamed(project)
    if (renamedProject) {
      debugInfo(`- ${renamedProject} has been renamed to ${project.name} `)
      renamedCollection.set(renamedProject, project)
    }
  }
  debugInfo(`- checking for renamed apps & functions`)
  projects.firebaseAppProjects.forEach((project) =>
    checkRenamedProject(project, renamedApps),
  )
  projects.firebaseFunctionProjects.forEach((project) =>
    checkRenamedProject(project, renamedFunctions),
  )

  // 2. determine deleted functions
  // do this either by detecting a dependency
  debugInfo(`- checking apps for deleted function deps`)
  projects.firebaseAppProjects.forEach(
    (firebaseAppProject, firebaseAppProjectName) => {
      // check the implicitDependencies for each app first
      firebaseAppProject.implicitDependencies?.map((dep) => {
        if (
          !projects.firebaseFunctionProjects.has(dep) &&
          !renamedFunctions.has(dep)
        ) {
          debugInfo(
            `- function ${dep} is a dep, but cannot be located so function is deleted`,
          )
          deletedFunctions.set(dep, true)
        }
      })

      // functions may also be removed using nx g rm <function> --forceRemove
      // which removes the implicitDep from the app, but doesnt update the firebase config
      // so we need to check the firebase config too, and determine any projects that are in there
      // but not in the workspace and mark them as deleted

      const firebaseConfigName = configs.firebaseAppConfigs.get(
        firebaseAppProjectName,
      )

      debugInfo(
        `- checking config ${firebaseConfigName} to see if it contains a function that doesnt exist`,
      )
      const config = configs.firebaseConfigs.get(firebaseConfigName)
      if (!config) {
        throw new Error(`Could not get firebase config '${firebaseConfigName}'`)
      }

      // ensure config functions is always an array, even if only 1 function
      // just in case user has modified this.
      if (!Array.isArray(config.functions)) {
        config.functions = [config.functions]
      }

      // remove deleted functions
      config.functions.forEach((func: FirebaseFunction) => {
        const funcName = func.codebase
        if (
          !projects.firebaseFunctionProjects.has(funcName) &&
          !renamedFunctions.has(funcName)
        ) {
          debugInfo(
            `- function ${funcName} is in config ${firebaseConfigName}, but cannot be located so function must be deleted`,
          )
          deletedFunctions.set(funcName, true)
        }
      })
    },
  )

  // nx g mv --project=source --destination=dstname
  // DOES update implicitDeps
  // Again, this means implicitDep wont be wrong, but we cant use it to detect renames
  // This is ok though because we detect renamed functions via tags

  // determine deleted apps
  debugInfo(`- checking functions for deleted apps`)
  projects.firebaseFunctionProjects.forEach(
    (firebaseFunctionProject, firebaseFunctionName) => {
      const { tagValue } = getFirebaseScopeFromTag(
        firebaseFunctionProject,
        'firebase:dep',
      )
      if (
        !projects.firebaseAppProjects.has(tagValue) &&
        !renamedApps.has(tagValue)
      ) {
        debugInfo(
          `- function ${firebaseFunctionName} points to app ${tagValue} which doesnt exist, so app must be deleted`,
        )
        deletedApps.set(tagValue, true)
      }
    },
  )

  debugInfo(`- deletedApps=${mapKeys(deletedApps)}`)
  debugInfo(`- deletedFunctions=${mapKeys(deletedFunctions)}`)
  debugInfo(`- renamedApps=${mapKeys(renamedApps)}`)
  debugInfo(`- renamedFunctions=${mapKeys(renamedFunctions)}`)

  return {
    deletedApps,
    deletedFunctions,
    renamedApps,
    renamedFunctions,
  }
}
