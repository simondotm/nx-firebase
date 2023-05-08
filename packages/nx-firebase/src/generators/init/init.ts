import '../../utils/e2ePatch' // intentional side effects
import type { GeneratorCallback, Tree } from '@nx/devkit'
import { convertNxGenerator, formatFiles, runTasksInSerial } from '@nx/devkit'
import { initGenerator as nodeInitGenerator } from '@nx/node'
// import { runTasksInSerial } from '@nx/workspace/src/utilities/run-tasks-in-serial'
import { addDependencies, normalizeOptions } from './lib'
import { addGitIgnoreEntry } from './lib/add-git-ignore-entry'
import type { InitGeneratorOptions } from './schema'

/**
 * `nx g @simondotm/nx-firebase:init` is based on the `@nrwl/nest` plugin
 *   which in turn is based on the `@nx/node` plugin
 *
 * Ensures the necessary firebase packages are installed in the nx workspace
 * The `@nx/node` init generate also ensures jest configs
 *
 * Docs say its for internal use only, but nest uses it, so we use it :)
 * https://nx.dev/packages/node/generators/init
 */
export async function initGenerator(
  tree: Tree,
  rawOptions: InitGeneratorOptions,
): Promise<GeneratorCallback> {
  addGitIgnoreEntry(tree)

  const options = normalizeOptions(rawOptions)
  const nodeInitTask = await nodeInitGenerator(tree, options)
  const installPackagesTask = addDependencies(tree)

  if (!options.skipFormat) {
    await formatFiles(tree)
  }

  return runTasksInSerial(nodeInitTask, installPackagesTask)
}

export default initGenerator

export const initSchematic = convertNxGenerator(initGenerator)
