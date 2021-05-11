import {
  addDependenciesToPackageJson,
  convertNxGenerator,
  formatFiles,
  GeneratorCallback,
  Tree,
  updateJson,
} from '@nrwl/devkit';
import { NxFirebaseInitGeneratorSchema } from './schema';
import { setDefaultCollection } from '@nrwl/workspace/src/utilities/set-default-collection';
import { jestInitGenerator } from '@nrwl/jest';

function updateDependencies(tree: Tree) {
  //SM: nrwl plugins auto update their plugins here, we don't need to do that.
  /*
  updateJson(tree, 'package.json', (json) => {
    delete json.dependencies['@nrwl/node'];
    return json;
  });
  */
  // instead we just add the firebase dependencies
  return addDependenciesToPackageJson(tree, 
    {
        'firebase-admin': 'latest', //"^9.2.0",
        'firebase-functions': 'latest' //"^3.11.0"
    }, 
    {
      //'@nrwl/node': nxVersion 
    });
}

function normalizeOptions(schema: NxFirebaseInitGeneratorSchema) {
  return {
    ...schema,
    unitTestRunner: schema.unitTestRunner ?? 'jest',
  };
}

export async function initGenerator(tree: Tree, schema: NxFirebaseInitGeneratorSchema) {
  const options = normalizeOptions(schema);

  setDefaultCollection(tree, '@nrwl/node');

  let jestInstall: GeneratorCallback;
  if (options.unitTestRunner === 'jest') {
    jestInstall = await jestInitGenerator(tree, {});
  }
  const installTask = await updateDependencies(tree);
  if (!options.skipFormat) {
    await formatFiles(tree);
  }

  return async () => {
    if (jestInstall) {
      await jestInstall();
    }
    await installTask();
  };
}

export default initGenerator;
export const initSchematic = convertNxGenerator(initGenerator);