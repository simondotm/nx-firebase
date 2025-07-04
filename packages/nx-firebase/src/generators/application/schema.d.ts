export interface ApplicationGeneratorSchema {
  /*  --- standard @nx project generator options ---*/
  /** The name of the firebase application. */
  name: string
  /** A directory where the application is placed. */
  directory?: string
  /** Add tags to the project (used for linting). */
  tags?: string
  /** The root project configuration (ex: apps/projectName). */
  rootProject?: boolean
  /* --- extra options for nx-firebase:app generator --- */
  project?: string
}

export interface ApplicationGeneratorNormalizedSchema
  extends ApplicationGeneratorSchema {
  projectName: string
  projectRoot: string
  parsedTags: string[]
  firebaseConfigName: string
  firebaseCliProject: string
}
