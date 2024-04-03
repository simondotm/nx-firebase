import {
  runTasksInSerial,
  type GeneratorCallback,
  type Tree,
  formatFiles,
} from '@nx/devkit'
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
  host: Tree,
  schema: InitGeneratorOptions,
): Promise<GeneratorCallback> {
  const tasks: GeneratorCallback[] = []
  addGitIgnore(host)
  addNxIgnore(host)
  if (!schema.skipFormat) {
    await formatFiles(host)
  }
  tasks.push(addDependencies(host))
  return runTasksInSerial(...tasks)
}

export default initGenerator
