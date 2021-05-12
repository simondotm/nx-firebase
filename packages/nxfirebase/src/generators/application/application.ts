import {
  addProjectConfiguration,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
  joinPathFragments,
  GeneratorCallback,
  ProjectConfiguration,
  TargetConfiguration,
  NxJsonProjectConfiguration,
  readWorkspaceConfiguration,
  updateWorkspaceConfiguration,
  convertNxGenerator
} from '@nrwl/devkit';
import * as path from 'path';
import * as fs from 'fs';
import { initGenerator } from '../init/init';
import { Schema } from './schema';
import { Linter, lintProjectGenerator } from '@nrwl/linter';
import { jestProjectGenerator } from '@nrwl/jest';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';

// SM: This generator is based on @nrwl/node:app
interface NormalizedSchema extends Schema {
  appProjectRoot: string;
  appProjectName: string;
  parsedTags: string[];
}

function normalizeOptions(
  host: Tree,
  options: Schema
): NormalizedSchema {

  const { appsDir, npmScope } = getWorkspaceLayout(host);

  const appDirectory = options.directory
    ? `${names(options.directory).fileName}/${names(options.name).fileName}`
    : names(options.name).fileName;

  const appProjectName = appDirectory.replace(new RegExp('/', 'g'), '-');

  const appProjectRoot = joinPathFragments(appsDir, appDirectory);

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  // SM: we put the scoped project name into the firebase functions package.json
  // it's not actually necessary to do this for firebase functions, 
  // but it gives the package.json more context when viewed
  const importPath =
    options.importPath || `@${npmScope}/${appProjectName}`;

  return {
    ...options,
    name: names(appProjectName).fileName,
    appProjectRoot,
    appProjectName: appProjectName,
    parsedTags,
    linter: options.linter ?? Linter.EsLint,
    unitTestRunner: options.unitTestRunner ?? 'jest',
    importPath: importPath
  };
}

/**
 * Add lint target to the firebase functions app
 * @param tree 
 * @param options 
 * @returns 
 */
export async function addLintingToApplication(
  tree: Tree,
  options: NormalizedSchema
): Promise<GeneratorCallback> {
  const lintTask = await lintProjectGenerator(tree, {
    linter: options.linter,
    project: options.name,
    tsConfigPaths: [
      joinPathFragments(options.appProjectRoot, 'tsconfig.app.json'),
    ],
    eslintFilePatterns: [
      `${options.appProjectRoot}/**/*.ts`,
    ],
    skipFormat: true,
  });

  return lintTask;
}

/**
 * Create build target for NxFirebase apps
 * @param project 
 * @param options 
 * @returns target configuration
 */
function getBuildConfig(
  project: ProjectConfiguration,
  options: NormalizedSchema
): TargetConfiguration {
  return {
    executor: '@simondotm/nxfirebase:build',
    outputs: ['{options.outputPath}'],
    options: {
      outputPath: joinPathFragments('dist', options.appProjectRoot),
      main: joinPathFragments(project.sourceRoot, 'index.ts'),
      tsConfig: joinPathFragments(options.appProjectRoot, 'tsconfig.app.json'),
      packageJson: joinPathFragments(options.appProjectRoot, 'package.json'),
      assets: [joinPathFragments(options.appProjectRoot, '*.md')],
    }
  };
}

/**
 * Create "firebase" target for NxFirebase apps
 * This is a work in progress, idea was to wrap the Firebase CLI with the --config part auto added
 *  but not sure its actually much more convenient yet.
 * @param options 
 * @returns target configuration
 */
function getFirebaseConfig(
  options: NormalizedSchema
): TargetConfiguration {
  return {
    executor: '@simondotm/nxfirebase:firebase',
    options: {
        firebaseConfig: `firebase.${options.appProjectName}.json`,
    },
  };
}

/**
 * Generate the new Firebase app project in the workspace
 * @param tree 
 * @param options 
 */
function addProject(tree: Tree, options: NormalizedSchema) {
  const project: ProjectConfiguration & NxJsonProjectConfiguration = {
    root: options.appProjectRoot,
    sourceRoot: joinPathFragments(options.appProjectRoot, 'src'),
    projectType: 'application',
    targets: {},
    tags: options.parsedTags,
  };
  project.targets.build = getBuildConfig(project, options);
  project.targets.firebase = getFirebaseConfig(options);

  addProjectConfiguration(tree, options.name, project);

  const workspace = readWorkspaceConfiguration(tree);

  if (!workspace.defaultProject) {
    workspace.defaultProject = options.name;
    updateWorkspaceConfiguration(tree, workspace);
  }
}


/**
 * Populate the NxFirebase app directory with the application files it needs:
 * - default database rules & indexes
 * - functions Typescript source directory & default entry script
 * - functions package.json
 * Also creates default `firebase.json` `.firebaserc` in the workspace root if they dont already exist
 * @param tree 
 * @param options 
 */
function addAppFiles(tree: Tree, options: NormalizedSchema) {
  const relativeRootPath = offsetFromRoot(options.appProjectRoot)
  const firebaseAppConfig = `firebase.${options.appProjectName}.json`
  const offsetFirebaseAppConfig = joinPathFragments(relativeRootPath, firebaseAppConfig)
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: relativeRootPath,
    offsetFirebaseAppConfig: offsetFirebaseAppConfig,
    firebaseAppConfig: firebaseAppConfig,
    template: '',
  };
  // generate the firebase app specific files
  // we put the functions package & template typescript source files in here
  // it has no side effects if the user isn't using functions, and is easier to just assume.
  // user can delete if not wanted, and update their firebase config accordingly
  // 

  // we also put any additional rules files in the application folder;
  // 1. so that they dont clutter up the root workspace
  // 2. so that they are more meaningfully associated with and located as assets within the nx firebase application project they relate to
  generateFiles(
    tree,
    path.join(__dirname, 'files'),
    options.appProjectRoot,
    templateOptions
  );

  // we put the template firebase.json config file in the root of the workspace, named (__name__) after the 
  // app project, so that it can be easily located with the cli command, and also enables nx workspaces
  // to contain multiple firebase projects
  // *.firebase.json files have to go in the root of the workspace, because firebase function deployment only allows
  //  the deployed package for functions to exist in a sub directory from where the firebase.json config is located
  // In principle for users that are not using the firebase functions feature, they could put this firebase.json config
  //  inside their app folder, but it's better to have consistent behaviour for every workspace

  generateFiles(
    tree,
    path.join(__dirname, 'files_workspace'),
    '',
    templateOptions
  );

  // generate these firebase files in the root workspace only if they dont already exist 
  // ( since we dont want to overwrite any existing configs)
  // For a fresh workspace, the firebase CLI needs at least an empty firebase.json and an empty .firebaserc
  //  in order to use commands like 'firebase use --add'
  // firebase.json is an annoying artefact of this requirement, as it isn't actually used by our firebase apps
  //  which each have their own firebase.<appname>.json config
  const firebaseDefaultConfig = path.join(tree.root, "firebase.json")
  //console.log("firebaseDefaultConfig=" + firebaseDefaultConfig)
  if (!fs.existsSync(firebaseDefaultConfig)) {
    generateFiles(
        tree,
        path.join(__dirname, 'files_firebase'),
        '',
        templateOptions
    );
  }else{
      console.log("✓ firebase.json already exists in this workspace")
  }
  const firebaseRc = path.join(tree.root, ".firebaserc")
  //console.log("firebaseRc=" + firebaseRc)
  if (!fs.existsSync(firebaseRc)) {
    generateFiles(
        tree,
        path.join(__dirname, 'files_firebaserc'),
        '',
        templateOptions
    );
  }else{
      console.log("✓ .firebaserc already exists in this workspace")
  }

}

/**
 * NxFirebase application generator
 * Creates a new firebase application in the nx workspace
 * @param tree 
 * @param schema 
 * @returns 
 */
export async function applicationGenerator(tree: Tree, schema: Schema) {
  const options = normalizeOptions(tree, schema);

  const tasks: GeneratorCallback[] = [];
  const initTask = await initGenerator(tree, {
    ...options,
    skipFormat: true,
  });
  tasks.push(initTask);

  addAppFiles(tree, options);
  addProject(tree, options);

  if (options.linter !== Linter.None) {
    const lintTask = await addLintingToApplication(tree, options);
    tasks.push(lintTask);
  }

  if (options.unitTestRunner === 'jest') {
    const jestTask = await jestProjectGenerator(tree, {
      project: options.name,
      setupFile: 'none',
      skipSerializers: true,
      supportTsx: false, //options.js, //(SM:Typescript only)
      babelJest: options.babelJest,
    });
    tasks.push(jestTask);
  }

  return runTasksInSerial(...tasks);
}


export default applicationGenerator
export const applicationSchematic = convertNxGenerator(applicationGenerator);