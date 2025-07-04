import { ProjectConfiguration } from '@nx/devkit'

/**
 * For the `@nx/node:application` generator:
 *
 * - unitTestRunner is always jest
 * - bundler is always esbuild
 * - linter is always eslint
 */
export interface FunctionGeneratorSchema {
  /*  --- standard @nx project generator options ---*/
  /** The name of the functions application. */
  name: string
  /** A directory where the application is placed. */
  directory?: string
  /** Add tags to the project (used for linting). */
  tags?: string
  /* --- extra options for nx-firebase:function generator --- */
  rootProject?: boolean

  /* --- Subset of `@nx/node:application` options that we forward to node app generator --- */
  /** */
  setParserOptionsProject?: boolean
  /** */
  skipFormat?: boolean
  /** Enable TS strict compiler options. */
  strict?: boolean

  /* --- extra options for nx-firebase:function generator --- */
  /** */
  app: string
  /** Supported NodeJS runtime. */
  runTime?: '18' | '20' | '22'
  /** ESLint format. */
  format?: 'esm' | 'cjs'
}

interface FunctionGeneratorNormalizedSchema extends FunctionGeneratorSchema {
  /** */
  isUsingTsSolutionConfig: boolean
  /** */
  projectName: string
  /** */
  projectRoot: string
  /** */
  parsedTags: string[]
  /** */
  firebaseConfigName: string
  /** */
  firebaseAppProject: ProjectConfiguration
}
