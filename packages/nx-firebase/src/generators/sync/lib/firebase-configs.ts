import { ProjectConfiguration, Tree, readJson } from '@nx/devkit'

import { FirebaseConfig } from '../../../utils'
import { CONFIG_NO_APP, FirebaseConfigs, FirebaseProjects } from './types'
import { debugInfo, mapEntries, mapKeys } from './debug'

const FIREBASE_TARGET_CONFIG_MATCHER = /--config[ =]([^\s]+)/
// const FIREBASE_CONFIG_FILE_MATCHER = /firebase.([^.]+).json/ // TODO: enhance this to match firebase.json or firebase.*.json
const FIREBASE_CONFIG_FILE_MATCHER = /(firebase)(\S*)(.json)/

export function getFirebaseConfigs(
  tree: Tree,
  projects: FirebaseProjects,
): FirebaseConfigs {
  const firebaseConfigs = new Map<string, FirebaseConfig>()
  const firebaseAppConfigs = new Map<string, string>()
  const firebaseConfigProjects = new Map<string, string>()

  // debugInfo(`- firebaseAppProjects=${[...firebaseAppProjects.keys()]}`)
  // debugInfo(
  //   `- firebaseFunctionProjects=${[...firebaseFunctionProjects.keys()]}`,
  // )

  debugInfo(`- firebaseAppProjects=${mapKeys(projects.firebaseAppProjects)}`)
  debugInfo(
    `- firebaseFunctionProjects=${mapKeys(projects.firebaseFunctionProjects)}`,
  )

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
  projects.firebaseAppProjects.forEach((project, name) => {
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
    firebaseConfigs,
    firebaseAppConfigs,
    firebaseConfigProjects,
  }
}

export function getFirebaseConfigFromCommand(
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
