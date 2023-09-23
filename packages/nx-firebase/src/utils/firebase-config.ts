import { Tree, ProjectConfiguration } from '@nx/devkit'

const FIREBASE_TARGET_CONFIG_MATCHER = /(--config[ =])([^\s]+)/

export interface FirebaseFunction {
  predeploy?: string[]
  source: string
  codebase: string
  runtime: string // 'nodejs16' | 'nodejs18' | 'nodejs20'
  ignore?: string[]
}

export interface FirebaseHosting {
  target?: string
  public: string
  ignore?: string[]
  redirects?: {
    source: string
    destination: string
    type: number
  }[]
  rewrites?: {
    source: string
    destination: string
    dynamicLinks?: boolean
    function?: {
      functionId: string
      region?: string
      pinTag?: boolean
    }
    run?: {
      serviceId: string
      region: string
    }
  }
  cleanUrls?: boolean
  trailingSlash?: boolean
  appAssociation?: 'AUTO'
  headers?: {
    source: string
    headers: {
      key: string
      value: string
    }[]
  }[]
}

export interface FirebaseConfig {
  database: {
    rules: string
  }
  firestore: {
    rules: string
    indexes: string
  }
  hosting: FirebaseHosting | FirebaseHosting[]
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
 * Return the config file from the provided firebase target command
 * This can be used to parse commands in additional configurations
 * @param project
 * @param command
 * @returns
 */
export function getFirebaseConfigFromCommand(
  tree: Tree,
  project: ProjectConfiguration,
  command: string,
) {
  const match = command.match(FIREBASE_TARGET_CONFIG_MATCHER)
  if (match && match.length === 3) {
    const configName = match[2]
    // check the config we've parsed actually resolves to a firebase config file in the workspace
    if (!tree.exists(configName)) {
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
 * Return the config file used by the `firebase` target command of the provided firebase app project
 * @param command
 * @param project
 * @param firebaseConfigs
 * @returns
 */
export function getFirebaseConfigFromProject(
  tree: Tree,
  project: ProjectConfiguration,
) {
  return getFirebaseConfigFromCommand(
    tree,
    project,
    project.targets.firebase.options.command,
  )
}

/**
 * Modify the config file used by the `firebase` target command of the provided firebase app project
 * @param project
 * @param configFileName
 */
export function setFirebaseConfigFromCommand(
  project: ProjectConfiguration,
  configFileName: string,
) {
  // we've already checked that firebase target exists when setting up workspace
  const firebaseTarget = project.targets.firebase
  firebaseTarget.options.command = firebaseTarget.options.command.replace(
    FIREBASE_TARGET_CONFIG_MATCHER,
    '$1' + configFileName,
  )
  // do this for all other configurations on this target too
  const configurations = firebaseTarget.configurations
  for (const configuration in configurations) {
    configurations[configuration].command = configurations[
      configuration
    ].command.replace(FIREBASE_TARGET_CONFIG_MATCHER, '$1' + configFileName)
  }
}
