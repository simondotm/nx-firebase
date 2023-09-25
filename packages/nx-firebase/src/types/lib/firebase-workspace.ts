import { ProjectConfiguration } from '@nx/devkit'

import { FirebaseConfig } from './firebase-config'

export const CONFIG_NO_APP = 'CONFIG_NO_APP'

export interface FirebaseProjects {
  /**
   * app projectName -> ProjectConfig
   */
  firebaseAppProjects: Map<string, ProjectConfiguration>
  /**
   * function projectName -> ProjectConfig
   */
  firebaseFunctionProjects: Map<string, ProjectConfiguration>
}

export interface FirebaseConfigs {
  /**
   * configFilename -> FirebaseConfig
   */
  firebaseConfigs: Map<string, FirebaseConfig>
  /**
   * projectName -> configFileName
   */
  firebaseAppConfigs: Map<string, string>
  /**
   * configFilename -> Project Name (or MISSING_CONFIG if config is not referenced by an app)
   */
  firebaseConfigProjects: Map<string, string>
}

export interface FirebaseChanges {
  /**
   * map of app project name -> deletion status
   */
  deletedApps: Map<string, boolean>
  /**
   * map of function project name -> deletion status
   */
  deletedFunctions: Map<string, boolean>
  /**
   * map of previous app name -> new app project
   */
  renamedApps: Map<string, ProjectConfiguration>

  /**
   * map of previous function name -> new function project
   */
  renamedFunctions: Map<string, ProjectConfiguration>
}

export type FirebaseWorkspace = FirebaseProjects &
  FirebaseChanges &
  FirebaseConfigs
