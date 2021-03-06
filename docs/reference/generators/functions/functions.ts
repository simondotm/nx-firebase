import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  getWorkspaceLayout,
  names,
  offsetFromRoot,
  Tree,
} from '@nrwl/devkit';
import { addDepsToPackageJson } from '@nrwl/workspace';
import { chain, noop, Rule } from '@angular-devkit/schematics';
import * as path from 'path';
import { NxFirebaseFunctionsGeneratorSchema } from './schema';

interface NormalizedSchema extends NxFirebaseFunctionsGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(
  host: Tree,
  options: NxFirebaseFunctionsGeneratorSchema
): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(host).appsDir}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags,
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
        "firebase-admin": "^9.2.0",
        "firebase-functions": "^3.11.0"
    },
    {}
  );
}

export default async function (host: Tree, options: NxFirebaseFunctionsGeneratorSchema) {
  const normalizedOptions = normalizeOptions(host, options);

  //const project = readProjectConfiguration(host, options.name);
  const { appsDir } = getWorkspaceLayout(host);

  addProjectConfiguration(host, normalizedOptions.projectName, {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: {
      build: {
        executor: '@nrwl/node:package',
        outputs: ['{options.outputPath}'],
        options: {
            outputPath: `dist/${appsDir}/${normalizedOptions.projectDirectory}`,
            tsConfig: `${normalizedOptions.projectRoot}/tsconfig.json`,
            packageJson: `${normalizedOptions.projectRoot}/package.json`,
            main: `${normalizedOptions.projectRoot}/src/index.ts`,
            assets: [`${normalizedOptions.projectRoot}/*.md`],
        },
      },
    },
    tags: normalizedOptions.parsedTags,
  });
  addFiles(host, normalizedOptions);
  await formatFiles(host);



    return chain([
        addDependencies(),
    ])


}
