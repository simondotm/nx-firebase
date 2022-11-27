import {
  AssetGlob,
  FileInputOutput,
} from '@nrwl/workspace/src/utilities/assets';


export interface FirebaseBuildExecutorSchema {
  main: string;
  tsConfig: string;
  outputPath: string;
  watch: boolean;
  sourceMap: boolean;
  assets: Array<AssetGlob | string>;
  packageJson: string;
  updateBuildableProjectDepsInPackageJson?: boolean;
  buildableProjectDepsInPackageJsonType?: 'dependencies' | 'peerDependencies';
  srcRootForCompilationRoot?: string;
  deleteOutputPath: boolean;
  cli?: boolean;
} // eslint-disable-line


export interface NormalizedBuilderOptions extends NodePackageBuilderOptions {
  files: Array<FileInputOutput>;
  normalizedOutputPath: string;
  relativeMainFileOutput: string;
}