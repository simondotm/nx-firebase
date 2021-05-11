import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
  joinPathFragments,
  GeneratorCallback,
  addDependenciesToPackageJson,
  ProjectConfiguration,
  TargetConfiguration,
  NxJsonProjectConfiguration,
  readWorkspaceConfiguration,
  updateWorkspaceConfiguration,
  convertNxGenerator
} from '@nrwl/devkit';
//import { addDepsToPackageJson, runCommandsGenerator } from '@nrwl/workspace';
//import { chain, noop, Rule } from '@angular-devkit/schematics';
import * as path from 'path';
import * as fs from 'fs';
import { initGenerator } from '../init/init';
import { NxFirebaseAppGeneratorSchema } from './schema';
import { Linter, lintProjectGenerator } from '@nrwl/linter';
import { jestProjectGenerator } from '@nrwl/jest';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';

interface NormalizedSchema extends NxFirebaseAppGeneratorSchema {
  appProjectRoot: string;
  parsedTags: string[];
  appProjectName: string;
  /*

    projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
  */
}

function normalizeOptions(
  host: Tree,
  options: NxFirebaseAppGeneratorSchema
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

  // we put the scoped project name into the firebase functions package.json
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

/*

  const { npmScope } = getWorkspaceLayout(host);    
  const defaultPrefix = npmScope;
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(host).appsDir}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  const importPath =
    options.importPath || `@${defaultPrefix}/${projectDirectory}`;

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
    importPath
  };
*/
}


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



function addAppFiles(tree: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.appProjectRoot),
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
  const firebaseConfig = path.join(tree.root, "firebase.json")
  //console.log("firebaseConfig=" + firebaseConfig)
  if (!fs.existsSync(firebaseConfig)) {
    generateFiles(
        tree,
        path.join(__dirname, 'files_firebase'),
        '',
        templateOptions
    );
  }else{
      console.log("✔️ firebase.json already exists in this workspace")
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
      console.log("✔️ .firebaserc already exists in this workspace")
  }

}


function addDependencies(tree: Tree) {
  return addDependenciesToPackageJson(tree, {
        'firebase-admin': 'latest', //"^9.2.0",
        'firebase-functions': 'latest' //"^3.11.0"
    }, 
    {});
}
/*
function addDependencies(): Rule {
    console.log("adding deps")
  return addDepsToPackageJson(
    {
        'firebase-admin': 'latest', //"^9.2.0",
        'firebase-functions': 'latest' //"^3.11.0"
    },
    {}
  );
}
*/


export async function applicationGenerator(tree: Tree, schema: NxFirebaseAppGeneratorSchema) {
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


/*
export default async function (tree: Tree, options: NxFirebaseAppGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);

  //const project = readProjectConfiguration(host, options.name);
  const { appsDir } = getWorkspaceLayout(tree);

  //add files before we add project config
  // so that functions folder exists
  addAppFiles(tree, normalizedOptions);

  
  // now add the project config, based on a node:package builder
  // no webpack required or desired for firebase functions
  addProjectConfiguration(tree, normalizedOptions.appProjectName, {
    root: normalizedOptions.appProjectRoot,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.appProjectRoot}/src`,
    targets: {
      build: {
        //executor: '@nrwl/node:package',
        executor: '@simondotm/nxfirebase:build',
        outputs: ['{options.outputPath}'],
        options: {
            outputPath: `dist/${appsDir}/${normalizedOptions.projectDirectory}`,
            tsConfig: `${normalizedOptions.projectRoot}/tsconfig.app.json`,
            packageJson: `${normalizedOptions.projectRoot}/package.json`,
            main: `${normalizedOptions.projectRoot}/src/index.ts`,
            assets: [
                `${normalizedOptions.projectRoot}/*.md`
            ],
        },
      },
      firebase: {
        executor: '@simondotm/nxfirebase:firebase',
        options: {
            firebaseConfig: `firebase.${normalizedOptions.projectName}.json`,
        },
      },
    },
    tags: normalizedOptions.parsedTags,
  });

  console.log("tree1=" + JSON.stringify(tree, null, 3))

  await formatFiles(tree);

  const tasks: GeneratorCallback[] = [];

  // add firebase dependencies to workspace package.json
  const depsTask = addDependencies(tree)
  tasks.push(depsTask);  

  console.log("tree2=" + JSON.stringify(tree, null, 3))


 // add lint target to firebase functions application
  if (options.linter !== Linter.None) {
    const lintTask = await addLintingToApplication(tree, normalizedOptions);
    tasks.push(lintTask);    
  }  

    console.log("tree3=" + JSON.stringify(tree, null, 3))

 // add test target to firebase functions application
  if (options.unitTestRunner === 'jest') {
    const jestTask = await jestProjectGenerator(tree, {
      project: options.name,
      setupFile: 'none',
      skipSerializers: true,
      supportTsx: true,
      babelJest: options.babelJest,
    });
    tasks.push(jestTask);
  }

  return runTasksInSerial(...tasks);  
}
*/

export default applicationGenerator
export const applicationSchematic = convertNxGenerator(applicationGenerator);