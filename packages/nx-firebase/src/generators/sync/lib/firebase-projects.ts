import {
  ProjectConfiguration,
  TargetConfiguration,
  Tree,
  getProjects,
  logger,
} from '@nx/devkit'
import { SyncGeneratorSchema } from '../schema'
import { debugInfo } from './debug'

export interface FirebaseProjects {
  firebaseAppProjects: Record<string, ProjectConfiguration>
  firebaseFunctionProjects: Record<string, ProjectConfiguration>
}

// export class FirebaseProjects {
//   firebaseAppProjects: Record<string, ProjectConfiguration> = {}
//   firebaseFunctionProjects: Record<string, ProjectConfiguration> = {}
//   // map of project name -> deletion status
//   deletedApps: Record<string, boolean> = {}
//   deletedFunctions: Record<string, boolean> = {}
//   // map of previous name -> new name
//   renamedApps: Record<string, string> = {}
//   renamedFunctions: Record<string, string> = {}

// }

export function isFirebaseApp(project: ProjectConfiguration) {
  return project.tags?.includes('firebase:app')
}

export function isFirebaseFunction(project: ProjectConfiguration) {
  return project.tags?.includes('firebase:function')
}

/**
 * Scan the workspace, identifying firebase projects managed by this plugin by their tags:
 * - firebase:app
 * - firebase:function
 * @param tree - host workspace
 * @returns FirebaseProjects object
 */
export function getAllFirebaseProjects(tree: Tree): FirebaseProjects {
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
