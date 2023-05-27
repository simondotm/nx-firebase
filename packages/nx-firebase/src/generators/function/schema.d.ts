import { ProjectConfiguration } from '@nx/devkit'

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

// subset of @nx/node:application options
interface NodeGeneratorOptions {
  setParserOptionsProject?: boolean
  skipFormat?: boolean
  // unitTestRunner is always jest
  // bundler is always esbuild
  // linter is always eslint
}

export interface FunctionGeneratorOptions extends NodeGeneratorOptions {
  name: string
  directory?: string
  tags?: string

  firebaseProject?: string
  firebaseApp: string
  runTime?: '16' | '18' | '20'
  format?: 'esm' | 'cjs'
}

interface NormalizedOptions extends FunctionGeneratorOptions {
  projectRoot: Path
  projectName: string
  firebaseConfigName: string
  firebaseAppProject: ProjectConfiguration
}
