// import '../../utils/e2ePatch' // intentional side effects
import { GeneratorCallback, Tree } from '@nx/devkit'
import { convertNxGenerator, formatFiles, runTasksInSerial } from '@nx/devkit'
import { applicationGenerator as nodeApplicationGenerator } from '@nx/node'
import { initGenerator } from '../init/init'
import {
  addProject,
  createFiles,
  normalizeOptions,
  toNodeApplicationGeneratorOptions,
} from './lib'

import { updateTsConfig } from '../../utils'

import { deleteFiles } from './lib/delete-files'
import type { ApplicationGeneratorOptions } from './schema'

/**
 * Firebase 'functions' application generator
 * Uses the `@nx/node` application generator as a base implementation
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

export default applicationGenerator

export const applicationSchematic = convertNxGenerator(applicationGenerator)
