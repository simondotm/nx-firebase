import { Tree } from '@nx/devkit'

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

export function generateFirebaseConfigName(tree: Tree, projectName: string) {
  const firebaseConfigName = tree.exists('firebase.json')
    ? `firebase.${projectName}.json`
    : 'firebase.json'
  // console.log(
  //   `generateFirebaseConfigName for ${projectName} config=${firebaseConfigName}`,
  // )
  return firebaseConfigName
}
