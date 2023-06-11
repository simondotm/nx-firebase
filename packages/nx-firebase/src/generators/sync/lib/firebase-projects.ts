import {
  ProjectConfiguration,
  TargetConfiguration,
  Tree,
  getProjects,
  logger,
  readJson,
} from '@nx/devkit'

import { FirebaseConfig } from '../../../utils'

import { SyncGeneratorSchema } from '../schema'
import { debugInfo, mapEntries, mapKeys } from './debug'
import { CONFIG_NO_APP, FirebaseProjects } from './types'

// const FIREBASE_CONFIG_FILE_MATCHER = /firebase.([^.]+).json/ // TODO: enhance this to match firebase.json or firebase.*.json
const FIREBASE_CONFIG_FILE_MATCHER = /(firebase)(\S*)(.json)/

const FIREBASE_TARGET_CONFIG_MATCHER = /--config[ =]([^\s]+)/
const FIREBASE_PROJECT_MATCHER = /(--project[ =])([^\s]+)/
//TODO: this will be replaced with the new firebase target
// const FIREBASE_DEPLOY_MATCHER = /(firebase deploy)/
const FIREBASE_COMMAND_MATCHER = /(firebase)/

export function isFirebaseApp(project: ProjectConfiguration) {
  return project.tags?.includes('firebase:app')
}

export function isFirebaseFunction(project: ProjectConfiguration) {
  return project.tags?.includes('firebase:function')
}

function getFirebaseConfigFromCommand(
  command: string,
  project: ProjectConfiguration,
  firebaseConfigs: Map<string, FirebaseConfig>,
) {
  // debugInfo(`- getFirebaseConfigFromCommand checking command '${command}'`)
  const match = command.match(FIREBASE_TARGET_CONFIG_MATCHER)
  // debugInfo(`- match=${match}`)
  if (match && match.length === 2) {
    const configName = match[1]
    // check the config we've parsed actually resolves to a firebase config file in the workspace
    if (!firebaseConfigs.has(configName)) {
      throw new Error(
        `Firebase app project ${project.name} is using a firebase config file ${configName} that does not exist in the workspace.`,
      )
    }
    return configName
  }
  throw new Error(
    `Firebase app project ${project.name} does not have --config set in its 'firebase' target.`,
  )
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
  const firebaseConfigs = new Map<string, FirebaseConfig>()
  const firebaseAppConfigs = new Map<string, string>()
  const firebaseConfigProjects = new Map<string, string>()

  debugInfo('- building list of firebase apps & functions')
  projects.forEach((project, projectName) => {
    if (isFirebaseApp(project)) {
      firebaseAppProjects.set(projectName, project)
    }
    if (isFirebaseFunction(project)) {
      firebaseFunctionProjects.set(projectName, project)
    }
  })

  // debugInfo(`- firebaseAppProjects=${[...firebaseAppProjects.keys()]}`)
  // debugInfo(
  //   `- firebaseFunctionProjects=${[...firebaseFunctionProjects.keys()]}`,
  // )

  debugInfo(`- firebaseAppProjects=${mapKeys(firebaseAppProjects)}`)
  debugInfo(`- firebaseFunctionProjects=${mapKeys(firebaseFunctionProjects)}`)

  // collect all firebase[.*].json config files in workspace
  const rootFiles = tree.children('')
  rootFiles.map((child) => {
    if (tree.isFile(child)) {
      // debugInfo(`- checking rootfile ${child} for config`)
      // if (child.includes('firebase.')) {
      //   debugInfo(`- !!! it should match this one`)
      //   debugInfo(`- match=${child.match(FIREBASE_CONFIG_FILE_MATCHER)}`)
      // }

      if (
        // child === 'firebase.json' ||
        child.match(FIREBASE_CONFIG_FILE_MATCHER)
      ) {
        // debugInfo(`- found firebase config file ${child}`)

        firebaseConfigs.set(child, readJson<FirebaseConfig>(tree, child))
        // set an firebaseConfigProjects as null for now, later we will add the project
        firebaseConfigProjects.set(child, CONFIG_NO_APP)
      }
    }
  })
  // debugInfo(`- firebaseConfigs=${[...firebaseConfigs.keys()]}`)
  debugInfo(`- firebaseConfigs=${mapKeys(firebaseConfigs)}`)

  // map firebase configs to their apps
  // we do this by reading the --config setting directly from each firebase app's firebase target
  // this is more robust & flexible than using filename assumptions for configs
  // it also means users can freely rename their firebase configs and the plugin will work
  firebaseAppProjects.forEach((project, name) => {
    const firebaseTarget = project.targets.firebase
    if (!firebaseTarget) {
      throw new Error(
        `Firebase app project ${name} does not have a 'firebase' target. Sync will no longer work.`,
      )
    }
    const firebaseCommand = firebaseTarget.options.command
    const firebaseConfigName = getFirebaseConfigFromCommand(
      firebaseCommand,
      project,
      firebaseConfigs,
    )
    firebaseAppConfigs.set(name, firebaseConfigName)
    firebaseConfigProjects.set(firebaseConfigName, name)

    // bit opinionated, but we need to sanity check that
    // production configurations on this target use the same config file.
    // since we cant rename configs safely with this scenario
    // different build configs should only differ in --project
    const configurations = firebaseTarget.configurations
    for (const configuration in configurations) {
      const additionalConfigName = getFirebaseConfigFromCommand(
        configurations[configuration].command,
        project,
        firebaseConfigs,
      )
      if (additionalConfigName !== firebaseConfigName) {
        throw new Error(
          `Firebase app project ${name} target firebase.configurations.${configuration} has a different --config setting which is unsupported by this plugin.`,
        )
      }
    }
  })

  // debugInfo(`firebaseAppConfigs=${[...firebaseAppConfigs.entries()]}`)
  // debugInfo(
  //   `firebaseConfigProjects=${[...firebaseConfigProjects.entries()]},
  //   )}`,
  // )

  debugInfo(`- firebaseAppConfigs=${mapEntries(firebaseAppConfigs)}`)
  debugInfo(
    `- firebaseConfigProjects=${mapEntries(firebaseConfigProjects)},
    )}`,
  )

  return {
    firebaseAppProjects,
    firebaseFunctionProjects,
    firebaseConfigs,
    firebaseAppConfigs,
    firebaseConfigProjects,
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
