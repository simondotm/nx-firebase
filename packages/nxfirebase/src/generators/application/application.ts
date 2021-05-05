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
  generateFiles(
    host,
    path.join(__dirname, 'files'),
    options.projectRoot,
    templateOptions
  );

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
    sourceRoot: `${normalizedOptions.projectRoot}/functions/src`,
    targets: {
      compile: {
        executor: '@nrwl/node:package',
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
      build: {
        executor: "@nrwl/workspace:run-commands",
        options: {
            "commands": [
                {
                    "command": `nx run ${normalizedOptions.projectName}:compile --with-deps`
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


