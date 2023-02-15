import '../../utils/e2ePatch' // intentional side effects
import { GeneratorCallback, Tree } from '@nrwl/devkit'
import { convertNxGenerator, formatFiles } from '@nrwl/devkit'
import { applicationGenerator as nodeApplicationGenerator } from '@nrwl/node'
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial'
import { initGenerator } from '../init/init'
import {
  addProject,
  createFiles,
  normalizeOptions,
  toNodeApplicationGeneratorOptions,
  updateTsConfig,
} from './lib'
import { deleteFiles } from './lib/delete-files'
import type { ApplicationGeneratorOptions } from './schema'

/**
 * Firebase 'functions' application generator
 * Uses the `@nrwl/node` application generator as a base implementation
 *
 * @param tree
 * @param rawOptions
 * @returns
 */
export async function functionGenerator(
  tree: Tree,
  rawOptions: ApplicationGeneratorOptions,
): Promise<GeneratorCallback> {
  const options = normalizeOptions(tree, rawOptions)

  // initialise plugin
  const initTask = await initGenerator(tree, {
    unitTestRunner: options.unitTestRunner,
    skipFormat: true,
  })

  // 1. check there is a firebase app already, report warning if not
  // 2. `npx nx g @nrwl/node:app auth-on-create --directory ayok/functions`
  // 3. options - esm, bundler=esbuild/webpack/rollup/none (use nx-firebase builder)
  // 4. default build target should be ok
  // 5. Add function deploy target to project.json (with deployOn build)
  // 6. check node app generator makes a package.json - set type: module for esm
  // 7. check tsconfig.app.json has module: es2020 for esm
  // 8. add function to firebase.xxx.json config
  //   {
  //     "source": "dist/apps/ayok/functions/auth-on-create",
  //     "codebase": "ayok-functions-auth-on-create",
  //     "runtime": "nodejs16"
  // }
  // 9. Update `firebase/project.json` to contain: `"implicitDependencies": [..., "ayok-functions-auth-on-create"]`
  //10. check the default function main.ts code is ok.
  //11. serve/watch should 'just work'
  // 12. Change firebase app generator to generate a separate function app instead of a nested app (OR NOT, explain that new version does not create a function app by default)
  // Check to see if we can hook deletion to remove: implicitDep, function from firebase.xx.json config - remove generator?
  //
  const nodeApplicationTask = await nodeApplicationGenerator(
    tree,
    toNodeApplicationGeneratorOptions(options),
    // rawOptions,
  )
  deleteFiles(tree, options)
  createFiles(tree, options)
  updateTsConfig(tree, options.projectRoot)
  addProject(tree, options)

  // ensures newly added files are formatted to match workspace style
  if (!options.skipFormat) {
    await formatFiles(tree)
  }

  return runTasksInSerial(initTask, nodeApplicationTask)
}

export default functionGenerator

// export const functionSchematic = convertNxGenerator(functionGenerator)
