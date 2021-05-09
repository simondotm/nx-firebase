import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import { addDepsToPackageJson, runCommandsGenerator } from '@nrwl/workspace';
import { chain, noop, Rule } from '@angular-devkit/schematics';
import * as path from 'path';
import * as fs from 'fs';
import { NxFirebaseAppGeneratorSchema } from './schema';

interface NormalizedSchema extends NxFirebaseAppGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  host: Tree,
  options: NxFirebaseAppGeneratorSchema
): NormalizedSchema {
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
}

function addFiles(host: Tree, options: NormalizedSchema) {
  const templateOptions = {
    ...options,
    ...names(options.name),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
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
    host,
    path.join(__dirname, 'files'),
    options.projectRoot,
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
    host,
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
  const firebaseConfig = path.join(host.root, "firebase.json")
  //console.log("firebaseConfig=" + firebaseConfig)
  if (!fs.existsSync(firebaseConfig)) {
    generateFiles(
        host,
        path.join(__dirname, 'files_firebase'),
        '',
        templateOptions
    );
  }else{
      console.log("✔️ firebase.json already exists in this workspace")
  }
  const firebaseRc = path.join(host.root, ".firebaserc")
  //console.log("firebaseRc=" + firebaseRc)
  if (!fs.existsSync(firebaseRc)) {
    generateFiles(
        host,
        path.join(__dirname, 'files_firebaserc'),
        '',
        templateOptions
    );
  }else{
      console.log("✔️ .firebaserc already exists in this workspace")
  }

}



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

export default async function (host: Tree, options: NxFirebaseAppGeneratorSchema) {
  const normalizedOptions = normalizeOptions(host, options);

  //const project = readProjectConfiguration(host, options.name);
  const { appsDir } = getWorkspaceLayout(host);

  //add files before we add project config
  // so that functions folder exists
  addFiles(host, normalizedOptions);

  // now add the project config, based on a node:package builder
  // no webpack required or desired for firebase functions
  addProjectConfiguration(host, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
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
      //TODO: deprecate this
      functions: {
        executor: '@simondotm/nxfirebase:functions',
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
      //TODO: replace this with a self-contained build command
      compile: {
        executor: "@nrwl/workspace:run-commands",
        options: {
            "commands": [
                {
                    "command": `nx run ${normalizedOptions.projectName}:build --with-deps`
                },
                {
                    "command": `nx run ${normalizedOptions.projectName}:functions`
                },
                {
                    "command": "echo all done"
                }
            ],
            "parallel": false
        },
      }

/*        
      build: {
        executor: '@simondotm/nxfirebase:build',
      },
*/
    },
    tags: normalizedOptions.parsedTags,
  });
/*
    addDepsToPackageJson(
        {
            "firebase": "^8.2.9"
        },
        {}
    );   
    */ 
  await formatFiles(host);



    return chain([
        addDependencies(),
    ])

}


