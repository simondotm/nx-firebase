import type { GeneratorCallback, Tree } from '@nx/devkit'
import { addDependencies } from './lib'
import { addGitIgnore, addNxIgnore } from './lib/add-git-ignore-entry'
import type { InitGeneratorOptions } from './schema'

/**
 * `nx g @simondotm/nx-firebase:init` 
 * 
 * Ensures the necessary firebase packages are installed in the nx workspace
 * It also adds `@nx/node` if it is not already installed
 *
 */
export async function initGenerator(
  tree: Tree,
  options: InitGeneratorOptions,
): Promise<GeneratorCallback> {
  addGitIgnore(tree)
  addNxIgnore(tree)
  return addDependencies(tree)
}

export default initGenerator

