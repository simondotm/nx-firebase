export interface Schema {
  // standard @nx project generator options
  name: string
  directory?: string
  tags?: string
  // extra options for @simondotm/nx-firebase:app generator
  project?: string
}

export interface NormalizedSchema extends Schema {
  projectName: string
  projectRoot: string
  parsedTags: string[]
  firebaseConfigName: string
}
