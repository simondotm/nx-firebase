import { NxFirebaseInitGeneratorSchema } from './schema';
import {
  addDependenciesToPackageJson,
//  convertNxGenerator,
  GeneratorCallback,
  readWorkspaceConfiguration,
  Tree,
  updateJson,
  updateWorkspaceConfiguration,
} from '@nrwl/devkit';
//import { jestInitGenerator } from '@nrwl/jest';
//import { cypressInitGenerator } from '@nrwl/cypress';
//import { webInitGenerator } from '@nrwl/web';
import { setDefaultCollection } from '@nrwl/workspace/src/utilities/set-default-collection';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';
/*
import {
  nxVersion,
  reactDomVersion,
  reactVersion,
  testingLibraryReactVersion,
  typesReactDomVersion,
  typesReactVersion,
} from '../../utils/versions';
*/

function setDefault(host: Tree) {
  const workspace = readWorkspaceConfiguration(host);

  workspace.generators = workspace.generators || {};
  const reactGenerators = workspace.generators['@nrwl/react'] || {};
  const generators = {
    ...workspace.generators,
    '@nrwl/react': {
      ...reactGenerators,
      application: {
        ...reactGenerators.application,
        babel: true,
      },
    },
  };

  updateWorkspaceConfiguration(host, { ...workspace, generators });
  setDefaultCollection(host, '@nrwl/react');
}

function updateDependencies(host: Tree) {
    /*
  updateJson(host, 'package.json', (json) => {
    if (json.dependencies && json.dependencies['@nrwl/react']) {
      delete json.dependencies['@nrwl/react'];
    }
    return json;
  });
  */
  // we install the latest versions of firebase for convenience
  // users can uninstall or install at a preferred version if they like.
  return addDependenciesToPackageJson(
    host,
    {
        'firebase-admin': 'latest', //"^9.2.0",
        'firebase-functions': 'latest' //"^3.11.0"
    },
    {
    }
  );
}

export async function nxfirebaseInitGenerator(host: Tree, schema: NxFirebaseInitGeneratorSchema) {
  const tasks: GeneratorCallback[] = [];

  console.log("called firebase init generator")
  //setDefault(host);


  //const initTask = await webInitGenerator(host, schema);
  //tasks.push(initTask);
  const installTask = updateDependencies(host);
  tasks.push(installTask);

  return runTasksInSerial(...tasks);
}

export default nxfirebaseInitGenerator;

//export const reactInitSchematic = convertNxGenerator(nxfirebaseInitGenerator);