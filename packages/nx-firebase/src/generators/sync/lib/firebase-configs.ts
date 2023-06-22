import { Tree, readJson } from '@nx/devkit'

import {
  FirebaseConfig,
  getFirebaseConfigFromCommand,
  getFirebaseConfigFromProject,
} from '../../../utils'
import { CONFIG_NO_APP, FirebaseConfigs, FirebaseProjects } from './types'
import { debugInfo, mapEntries, mapKeys } from '../../../utils/debug'

const FIREBASE_CONFIG_FILE_MATCHER = /(firebase)(\S*)(.json)/

export function getFirebaseConfigs(
  tree: Tree,
  projects: FirebaseProjects,
): FirebaseConfigs {
  const firebaseConfigs = new Map<string, FirebaseConfig>()
  const firebaseAppConfigs = new Map<string, string>()
  const firebaseConfigProjects = new Map<string, string>()

  debugInfo(`- firebaseAppProjects=${mapKeys(projects.firebaseAppProjects)}`)
  debugInfo(
    `- firebaseFunctionProjects=${mapKeys(projects.firebaseFunctionProjects)}`,
  )

  // collect all firebase[.*].json config files in workspace
  const rootFiles = tree.children('')
  rootFiles.map((child) => {
    if (tree.isFile(child)) {
      if (child.match(FIREBASE_CONFIG_FILE_MATCHER)) {
        firebaseConfigs.set(child, readJson<FirebaseConfig>(tree, child))
        // set an firebaseConfigProjects as null for now, later we will add the project
        firebaseConfigProjects.set(child, CONFIG_NO_APP)
      }
    }
  })
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
    const firebaseConfigName = getFirebaseConfigFromProject(tree, project)
    firebaseAppConfigs.set(name, firebaseConfigName)
    firebaseConfigProjects.set(firebaseConfigName, name)

    // bit opinionated, but we need to sanity check that
    // production configurations on this target use the same config file.
    // since we cant rename configs safely with this scenario
    // different build configs should only differ in --project
    const configurations = firebaseTarget.configurations
    for (const configuration in configurations) {
      const additionalConfigName = getFirebaseConfigFromCommand(
        tree,
        project,
        configurations[configuration].command,
      )
      if (additionalConfigName !== firebaseConfigName) {
        throw new Error(
          `Firebase app project ${name} target firebase.configurations.${configuration} has a different --config setting which is unsupported by this plugin.`,
        )
      }
    }
  })

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
