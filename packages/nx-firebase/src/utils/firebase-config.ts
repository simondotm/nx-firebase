import { Tree } from '@nx/devkit'
import { debugInfo } from '../generators/sync/lib'

const USE_CONFIG_FALLBACK = true

export interface FirebaseFunction {
  predeploy?: string[]
  source: string
  codebase: string
  runtime: string // 'nodejs16' | 'nodejs18' | 'nodejs20'
}

export interface FirebaseConfig {
  database: {
    rules: string
  }
  firestore: {
    rules: string
    indexes: string
  }
  hosting: {
    target: string
    public: string
    ignore: string[]
    rewrites: {
      source: string
      destination: string
    }[]
    headers: [
      {
        source: string
        headers: {
          key: string
          value: string
        }[]
      },
    ]
  }[]
  storage: {
    rules: string
  }
  functions: FirebaseFunction | FirebaseFunction[]
  emulators: {
    functions: {
      port: number
    }
    firestore: {
      port: number
    }
    hosting: {
      port: number
    }
    auth: {
      port: number
    }
    pubsub: {
      port: number
    }
  }
}

/**
 * Generate a firebase config file name for the given project
 * If `firebase.json` doesnt already exist in the workspace, use that
 * Otherwise use `firebase.<projectname>.json`
 * @param tree
 * @param projectName
 * @returns firebase config name for this project
 */
export function generateFirebaseConfigName(tree: Tree, projectName: string) {
  if (USE_CONFIG_FALLBACK) {
    const firebaseConfigName = tree.exists('firebase.json')
      ? `firebase.${projectName}.json`
      : 'firebase.json'

    debugInfo(
      `generateFirebaseConfigName returning FALLBACK ${firebaseConfigName}`,
    )
    return firebaseConfigName
  } else {
    debugInfo(`generateFirebaseConfigName returning NON FALLBACK`)
    return `firebase.${projectName}.json`
  }
}

/**
 * Determine the firebase config file name for the given project
 * If `firebase.<projectname>.json` exists in the workspace, then use that
 * Otherwise use `firebase.json`
 * @param tree
 * @param projectName
 * @returns firebase config file name
 */
export function calculateFirebaseConfigName(tree: Tree, projectName: string) {
  let firebaseConfigName = `firebase.${projectName}.json`
  if (USE_CONFIG_FALLBACK) {
    if (!tree.exists(firebaseConfigName)) {
      firebaseConfigName = 'firebase.json'
    }
  }

  // if (!tree.exists(firebaseConfigName)) {
  //   throw new Error(
  //     `Could not find firebase config called '${firebaseConfigName}' in this workspace.`,
  //   )
  // }

  return firebaseConfigName
}
