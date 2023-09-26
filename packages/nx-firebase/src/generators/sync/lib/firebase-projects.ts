import {
  ProjectConfiguration,
  TargetConfiguration,
  Tree,
  getProjects,
  logger,
} from '@nx/devkit'

import { SyncGeneratorSchema } from '../schema'
import { debugInfo } from '../../../utils/debug'
import { FirebaseProjects } from '../../../types'

const FIREBASE_PROJECT_MATCHER = /(--project[ =])([^\s]+)/
const FIREBASE_COMMAND_MATCHER = /(firebase)/

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
export function getFirebaseProjects(tree: Tree): FirebaseProjects {
  const projects = getProjects(tree)
  const firebaseAppProjects = new Map<string, ProjectConfiguration>()
  const firebaseFunctionProjects = new Map<string, ProjectConfiguration>()

  debugInfo('- building list of firebase apps & functions')
  projects.forEach((project, projectName) => {
    if (isFirebaseApp(project)) {
      firebaseAppProjects.set(projectName, project)
    }
    if (isFirebaseFunction(project)) {
      firebaseFunctionProjects.set(projectName, project)
    }
  })

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
  if (command.includes('firebase')) {
    debugInfo('- found firebase target command')
    debugInfo(`- command=${command}`)
    if (command.includes('--project')) {
      debugInfo('- found --project in firebase target command')
      // already set, so update
      target.options.command = command.replace(
        FIREBASE_PROJECT_MATCHER,
        '$1' + options.project,
      )
      debugInfo(`- new command: ${target.options.command}`)

      logger.info(
        `CHANGE updating firebase target --project for '${options.app}' to '--project=${options.project}'`,
      )
      return true
    } else {
      debugInfo('- did not find --project in deploy command')

      // no set, so add
      target.options.command = command.replace(
        FIREBASE_COMMAND_MATCHER,
        '$1' + ' ' + `--project=${options.project}`,
      )
      debugInfo(`- new command: ${target.options.command}`)
      logger.info(
        `CHANGE setting firebase target --project for '${options.app}' to '--project=${options.project}'`,
      )
      return true
    }
  }
  return false
}
