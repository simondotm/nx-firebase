export interface ApplicationGeneratorOptions {
  // standard @nx/node:app options
  name: string
  directory?: string
  tags?: string
  // extra options for @simondotm/nx-firebase:app generator
  project?: string
  // firebaseProject?: string
  // firebaseConfig?: string
}

export interface NormalizedOptions extends ApplicationGeneratorOptions {
  projectRoot: Path
  projectName: string
  firebaseConfigName: string
}
