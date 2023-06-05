// import '../../utils/e2ePatch' // intentional side effects
import {
  GeneratorCallback,
  ProjectConfiguration,
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
  generateFirebaseConfigName,
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

  // console.log(`projectName=${projectName}`)
  // console.log(`options=${options}`)
  // console.log(options)

  const firebaseApp = names(options.app).fileName
  // console.log(`options.firebaseApp ${firebaseApp}`)
  // get/validate the firebase app project this function will be attached to
  let firebaseAppProject: ProjectConfiguration
  try {
    firebaseAppProject = readProjectConfiguration(tree, firebaseApp)
  } catch (err) {
    throw new Error(
      `A firebase application project called '${firebaseApp}' was not found in this workspace.`,
    )
  }

  // use firebase.<project>.json if it exists, otherwise fall back to firebase.json
  let firebaseConfigName = `firebase.${firebaseApp}.json`
  if (!tree.exists(firebaseConfigName)) {
    // console.log(`looking for ${firebaseConfigName} failed, using fallback`)
    firebaseConfigName = `firebase.json`
  }

  // console.log(
  //   `project=${options.name} firebaseConfigName=${firebaseConfigName}`,
  // )

  if (!tree.exists(firebaseConfigName)) {
    throw new Error(
      `Could not find firebase config called '${firebaseConfigName}' in this workspace.`,
    )
  }

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
  const projects = getProjects(tree)
  console.log(JSON.stringify(tree))
  console.log(`projects=${JSON.stringify(projects)}`)

  const tasks: GeneratorCallback[] = []

  const options = normalizeOptions(tree, rawOptions)

  // // make sure this firebase config name is unique.
  // // shouldn't happen as nx already enforces unique project names
  // if (tree.exists(options.firebaseConfigName)) {
  //   throw Error(
  //     `There is already a firebase configuration called '${options.firebaseConfigName}' in this workspace. Please try a different project name.`,
  //   )
  // }

  // initialise plugin
  const initTask = await initGenerator(tree, {})
  tasks.push(initTask)

  // Use @nx/node:app to scaffold our function application, then modify as required
  // `nx g @nx/node:app function-name --directory functions/dir --e2eTestRunner=none --framework=none --unitTestRunner=jest --bundler=esbuild --tags=firebase:firebase-app`

  // Function apps are tagged so that they can built/watched with run-many
  const tags =
    `firebase:function,firebase:name:${options.projectName},firebase:app:${options.firebaseAppProject.name}` +
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
