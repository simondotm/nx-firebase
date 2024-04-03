import {
  GeneratorCallback,
  readProjectConfiguration,
  Tree,
  convertNxGenerator,
  formatFiles,
  runTasksInSerial,
  names,
  getProjects,
} from '@nx/devkit'
import { applicationGenerator as nodeApplicationGenerator } from '@nx/node'

import { initGenerator } from '../init/init'
import { getFirebaseConfigFromProject, updateTsConfig } from '../../utils'

import { addFunctionConfig, createFiles, updateProject } from './lib'
import type { Schema, NormalizedSchema } from './schema'
import { determineProjectNameAndRootOptions } from '@nx/devkit/src/generators/project-name-and-root-utils'
import { packageVersions } from '../../__generated__/nx-firebase-versions'

export async function normalizeOptions(
  host: Tree,
  options: Schema,
  callingGenerator = '@simondotm/nx-firebase:function',
): Promise<NormalizedSchema> {
  const {
    projectName: appProjectName,
    projectRoot,
    projectNameAndRootFormat,
  } = await determineProjectNameAndRootOptions(host, {
    name: options.name,
    projectType: 'application',
    directory: options.directory,
    projectNameAndRootFormat: options.projectNameAndRootFormat,
    rootProject: options.rootProject,
    callingGenerator,
  })

  options.rootProject = projectRoot === '.'
  options.projectNameAndRootFormat = projectNameAndRootFormat

  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : []

  // const { projectName, projectRoot } = getProjectName(
  //   host,
  //   options.name,
  //   options.directory,
  // )

  // get & validate the firebase app project this function will be attached to
  const firebaseApp = names(options.app).fileName
  const projects = getProjects(host)
  if (!projects.has(firebaseApp)) {
    throw new Error(
      `A firebase application project called '${firebaseApp}' was not found in this workspace.`,
    )
  }

  const firebaseAppProject = readProjectConfiguration(host, firebaseApp)

  // read the firebase config used by the parent app project
  const firebaseConfigName = getFirebaseConfigFromProject(
    host,
    firebaseAppProject,
  )

  return {
    ...options,
    name: names(options.name).fileName,
    projectName: appProjectName,
    projectRoot,
    parsedTags,
    firebaseConfigName,
    firebaseAppProject,
  }

  // return {
  //   ...options,
  //   runTime: options.runTime || '16',
  //   format: options.format || 'esm',
  //   projectRoot,
  //   projectName,
  //   firebaseConfigName,
  //   firebaseAppProject,
  // }
}

/**
 * Firebase 'functions' application generator
 * Uses the `@nx/node` application generator as a base implementation
 *
 * @param host
 * @param schema
 * @returns
 */
export async function functionGenerator(
  host: Tree,
  schema: Schema,
): Promise<GeneratorCallback> {
  const tasks: GeneratorCallback[] = []

  const options = await normalizeOptions(host, {
    // set default options
    projectNameAndRootFormat: 'derived',
    runTime: packageVersions.nodeEngine as typeof schema.runTime, // we can be sure that our firebaseNodeEngine value satisfies the type
    // apply overrides from user
    ...schema,
  })

  if (!options.runTime) {
    throw new Error('No runtime specified for the function app')
  }

  // const options = normalizeOptions(host, schema)

  // initialise plugin
  const initTask = await initGenerator(host, {})
  tasks.push(initTask)

  // We use @nx/node:app to scaffold our function application, then modify as required
  // `nx g @nx/node:app function-name --directory functions/dir --e2eTestRunner=none --framework=none --unitTestRunner=jest --bundler=esbuild --tags=firebase:firebase-app`

  // Function apps are tagged so that they can built/watched with run-many
  const tags =
    `firebase:function,firebase:name:${options.projectName},firebase:dep:${options.firebaseAppProject.name}` +
    (options.tags ? `,${options.tags}` : '')

  const nodeApplicationTask = await nodeApplicationGenerator(host, {
    name: options.name,
    directory: options.directory,
    projectNameAndRootFormat: options.projectNameAndRootFormat,
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
  createFiles(host, options)

  // update TS config for esm or cjs
  updateTsConfig(host, options.projectRoot, options.runTime, options.format)

  // reconfigure the @nx/node:app to suit firebase functions
  updateProject(host, options)

  // update firebase functions config
  addFunctionConfig(host, options)

  // ensures newly added files are formatted to match workspace style
  if (!options.skipFormat) {
    await formatFiles(host)
  }

  return runTasksInSerial(...tasks)
}

export default functionGenerator
export const functionSchematic = convertNxGenerator(functionGenerator)
