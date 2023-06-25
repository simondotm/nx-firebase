import {
  GeneratorCallback,
  readProjectConfiguration,
  Tree,
  convertNxGenerator,
  formatFiles,
  runTasksInSerial,
  names,
  getProjects,
} from '@nrwl/devkit'
import { applicationGenerator as nodeApplicationGenerator } from '@nrwl/node'

import { initGenerator } from '../init/init'
import {
  getFirebaseConfigFromProject,
  getProjectName,
  updateTsConfig,
} from '../../utils'

import { addFunction, createFiles, updateProject } from './lib'
import type { FunctionGeneratorOptions, NormalizedOptions } from './schema'

export function normalizeOptions(
  tree: Tree,
  options: FunctionGeneratorOptions,
): NormalizedOptions {
  const { projectName, projectRoot } = getProjectName(
    tree,
    options.name,
    options.directory,
  )

  // get & validate the firebase app project this function will be attached to
  const firebaseApp = names(options.app).fileName
  const projects = getProjects(tree)
  if (!projects.has(firebaseApp)) {
    throw new Error(
      `A firebase application project called '${firebaseApp}' was not found in this workspace.`,
    )
  }

  const firebaseAppProject = readProjectConfiguration(tree, firebaseApp)

  // read the firebase config used by the parent app project
  const firebaseConfigName = getFirebaseConfigFromProject(
    tree,
    firebaseAppProject,
  )

  return {
    ...options,
    runTime: options.runTime || '16',
    format: options.format || 'esm',
    projectRoot,
    projectName,
    firebaseConfigName,
    firebaseAppProject,
  }
}

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
  rawOptions: FunctionGeneratorOptions,
): Promise<GeneratorCallback> {
  const tasks: GeneratorCallback[] = []
  const options = normalizeOptions(tree, rawOptions)

  // initialise plugin
  const initTask = await initGenerator(tree, {})
  tasks.push(initTask)

  // We use @nx/node:app to scaffold our function application, then modify as required
  // `nx g @nx/node:app function-name --directory functions/dir --e2eTestRunner=none --framework=none --unitTestRunner=jest --bundler=esbuild --tags=firebase:firebase-app`

  // Function apps are tagged so that they can built/watched with run-many
  const tags =
    `firebase:function,firebase:name:${options.projectName},firebase:dep:${options.firebaseAppProject.name}` +
    (options.tags ? `,${options.tags}` : '')

  const nodeApplicationTask = await nodeApplicationGenerator(tree, {
    name: options.name,
    directory: options.directory,
    tags,
    setParserOptionsProject: options.setParserOptionsProject,
    skipFormat: options.skipFormat,
    e2eTestRunner: 'none',
    bundler: 'esbuild',
    framework: 'none',
    unitTestRunner: 'jest',
  })
  tasks.push(nodeApplicationTask)

  // generate function app specific files
  createFiles(tree, options)

  // update TS config for esm or cjs
  updateTsConfig(tree, options.projectRoot, options.runTime, options.format)

  // reconfigure the @nx/node:app to suit firebase functions
  updateProject(tree, options)

  // update firebase functions config
  addFunction(tree, options)

  // ensures newly added files are formatted to match workspace style
  if (!options.skipFormat) {
    await formatFiles(tree)
  }

  return runTasksInSerial(...tasks)
}

export default functionGenerator
export const functionSchematic = convertNxGenerator(functionGenerator)
