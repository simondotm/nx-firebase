import { ProjectConfiguration } from '@nx/devkit'

export interface Schema {
  // standard nx generator options
  name: string
  directory?: string
  tags?: string

  // subset of @nx/node:application options that we forward to node app generator
  setParserOptionsProject?: boolean
  skipFormat?: boolean
  // unitTestRunner is always jest
  // bundler is always esbuild
  // linter is always eslint

  // nx-firebase:function generator specific options
  app: string
  runTime?: '20' | '22' | '24'
  format?: 'esm' | 'cjs'
}

interface NormalizedSchema extends Schema {
  projectName: string
  projectRoot: string
  parsedTags: string[]

  firebaseConfigName: string
  firebaseAppProject: ProjectConfiguration
}
