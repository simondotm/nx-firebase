import type { GeneratorCallback, Tree } from '@nrwl/devkit'
import { convertNxGenerator, formatFiles } from '@nrwl/devkit'
import { applicationGenerator as nodeApplicationGenerator } from '@nrwl/node'
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial'
import { initGenerator } from '../init/init'
import {
  createFiles,
  normalizeOptions,
  toNodeApplicationGeneratorOptions,
  updateTsConfig,
} from './lib/'
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
export async function applicationGenerator(
  tree: Tree,
  rawOptions: ApplicationGeneratorOptions,
): Promise<GeneratorCallback> {
  const options = normalizeOptions(tree, rawOptions)
  const initTask = await initGenerator(tree, {
    unitTestRunner: options.unitTestRunner,
    skipFormat: true,
  })
  const nodeApplicationTask = await nodeApplicationGenerator(
    tree,
    toNodeApplicationGeneratorOptions(options),
  )
  deleteFiles(tree, options)
  createFiles(tree, options)
  updateTsConfig(tree, options)

  // ensures newly added files are formatted to match workspace style
  if (!options.skipFormat) {
    await formatFiles(tree)
  }

  return runTasksInSerial(initTask, nodeApplicationTask)
}

export default applicationGenerator

export const applicationSchematic = convertNxGenerator(applicationGenerator)
