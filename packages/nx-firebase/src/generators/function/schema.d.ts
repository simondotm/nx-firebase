import { ProjectConfiguration } from '@nx/devkit'
import { ProjectNameAndRootFormat } from '@nx/devkit/src/generators/project-name-and-root-utils'

// export interface Schema {
//   name: string;
//   skipFormat?: boolean;
//   skipPackageJson?: boolean;
//   directory?: string;
//   unitTestRunner?: 'jest' | 'none';
//   e2eTestRunner?: 'jest' | 'none';
//   linter?: Linter;
//   tags?: string;
//   frontendProject?: string;
//   babelJest?: boolean;
//   js?: boolean;
//   pascalCaseFiles?: boolean;
//   setParserOptionsProject?: boolean;
//   standaloneConfig?: boolean;
//   bundler?: 'esbuild' | 'webpack';
//   framework?: NodeJsFrameWorks;
//   port?: number;
//   rootProject?: boolean;
//   docker?: boolean;
//   isNest?: boolean;
// }

export interface Schema {
  // standard nx generator options
  name: string
  directory?: string
  tags?: string
  projectNameAndRootFormat?: ProjectNameAndRootFormat
  rootProject?: boolean

  // subset of @nx/node:application options that we forward to node app generator
  setParserOptionsProject?: boolean
  skipFormat?: boolean
  // unitTestRunner is always jest
  // bundler is always esbuild
  // linter is always eslint

  // nx-firebase:function generator specific options
  app: string
  runTime?: '16' | '18' | '20'
  format?: 'esm' | 'cjs'
}

interface NormalizedSchema extends Schema {
  projectName: string
  projectRoot: string
  parsedTags: string[]

  firebaseConfigName: string
  firebaseAppProject: ProjectConfiguration
}
