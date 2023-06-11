import { ProjectConfiguration } from '@nx/devkit'

import { FirebaseConfig } from '../../../utils'

export const CONFIG_NO_APP = 'CONFIG_NO_APP'

export interface FirebaseProjects {
  // projectName -> ProjectConfig
  firebaseAppProjects: Map<string, ProjectConfiguration>
  firebaseFunctionProjects: Map<string, ProjectConfiguration>
  // configFilename -> FirebaseConfig
  firebaseConfigs: Map<string, FirebaseConfig>
  // projectName -> configFileName
  firebaseAppConfigs: Map<string, string>
  // configFilename -> Project Name (or MISSING_CONFIG if config is not referenced by an app)
  firebaseConfigProjects: Map<string, string>
}

export interface FirebaseWorkspaceChanges {
  // map of project name -> deletion status
  deletedApps: Map<string, boolean>
  deletedFunctions: Map<string, boolean>
  // map of previous name -> new name
  renamedApps: Map<string, string>
  renamedFunctions: Map<string, string>
}
