import {
  GeneratorCallback,
  readProjectConfiguration,
  Tree,
  convertNxGenerator,
  formatFiles,
  runTasksInSerial,
  names,
  getProjects,
  getWorkspaceLayout,
  updateJson,
  joinPathFragments,
} from '@nx/devkit'
import { isUsingTsSolutionSetup } from '@nx/js/src/utils/typescript/ts-solution-setup'
import { applicationGenerator as nodeApplicationGenerator } from '@nx/node'
import type { CompilerOptions } from 'typescript'

import { initGenerator } from '../init/init'
import { getFirebaseConfigFromProject, updateTsConfig } from '../../utils'

import { addFunctionConfig, createFiles, updateProject } from './lib'
import type {
  FunctionGeneratorSchema,
  FunctionGeneratorNormalizedSchema,
} from './schema'

/**
 * Update the tsconfig.json of the project file.
 *
 * @param options
 * @returns compiler options.
 */
function getCompilerOptions(
  options: FunctionGeneratorNormalizedSchema,
): Record<keyof CompilerOptions, boolean> {
  return {
    ...(options.strict
      ? {
          forceConsistentCasingInFileNames: true,
          strict: true,
          importHelpers: true,
          noImplicitOverride: true,
          noImplicitReturns: true,
          noFallthroughCasesInSwitch: true,
          ...(!options.isUsingTsSolutionConfig
            ? { noPropertyAccessFromIndexSignature: true }
            : {}),
        }
      : {}),
  }
}

/**
 *
 * @param tree
 * @param options
 * @returns
 */
function normalizeOptions(
  tree: Tree,
  options: FunctionGeneratorSchema,
): FunctionGeneratorNormalizedSchema {
  /** Ensure if using TS solution. */
  const isUsingTsSolutionConfig = isUsingTsSolutionSetup(tree)

  /**  */
  const name = names(options.name).fileName
  // const projectDirectory = name
  /**
   * By default, we use the name of the firebase application as directory,
   * otherwise concat the directory.
   */
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name

  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-')
  const projectRoot = `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : []

  /**
   * Get & validate the firebase app project this function will be attached to.
   */
  const firebaseApp = names(options.app).fileName
  const projects = getProjects(tree)
  if (!projects.has(firebaseApp)) {
    throw new Error(
      `A firebase application project called '${firebaseApp}' was not found in this workspace.`,
    )
  }

  /** Read the firebase config used by the parent app project */
  const firebaseAppProject = readProjectConfiguration(tree, firebaseApp)
  const firebaseConfigName = getFirebaseConfigFromProject(
    tree,
    firebaseAppProject,
  )

  return {
    ...options,
    name,
    directory: projectRoot,
    runTime: options.runTime ?? '18',
    format: options.format ?? 'esm',
    projectName,
    projectRoot,
    parsedTags,
    firebaseConfigName,
    firebaseAppProject,
    isUsingTsSolutionConfig,
  }
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
  tree: Tree,
  options: FunctionGeneratorSchema,
): Promise<GeneratorCallback> {
  const normalizedOptions: FunctionGeneratorNormalizedSchema = normalizeOptions(
    tree,
    options,
  )

  /** Execute the `init` generator before adding the project configuration. */
  const initTask: GeneratorCallback = await initGenerator(tree, {})

  /**
   * We use `@nx/node:app` to scaffold our function application, then modify as
   * required `nx g @nx/node:app function-name --directory functions/dir
   * --e2eTestRunner=none --framework=none --unitTestRunner=jest
   * --bundler=esbuild --tags=firebase:firebase-app`
   */

  /** Function apps are tagged so that they can built/watched with run-many */
  const tags = [
    'firebase:function',
    `firebase:name:${normalizedOptions.projectName}`,
    `firebase:dep:${normalizedOptions.firebaseAppProject.name}`,
    ...normalizedOptions.parsedTags,
  ].join(',')

  const nodeApplicationTask: GeneratorCallback = await nodeApplicationGenerator(
    tree,
    {
      name: normalizedOptions.name,
      directory: normalizedOptions.directory,
      rootProject: normalizedOptions.rootProject,
      tags,
      setParserOptionsProject: normalizedOptions.setParserOptionsProject,
      skipFormat: normalizedOptions.skipFormat,
      e2eTestRunner: 'none',
      /** Should work per https://github.com/nrwl/nx/issues/29664 */
      swcJest: true,
      bundler: 'esbuild',
      framework: 'none',
      unitTestRunner: 'jest',
    },
  )

  /** generate function app specific files */
  createFiles(tree, normalizedOptions)

  /** Update TS config for esm or cjs */
  updateTsConfig(
    tree,
    normalizedOptions.projectRoot,
    normalizedOptions.runTime,
    normalizedOptions.format,
  )

  /** Update the tsconfig.json with compiler options */
  const compilerOptionOverrides = getCompilerOptions(normalizedOptions)

  updateJson(
    tree,
    joinPathFragments(normalizedOptions.projectRoot, 'tsconfig.json'),
    (json) => {
      json.compilerOptions = {
        ...json.compilerOptions,
        ...compilerOptionOverrides,
      }
      return json
    },
  )

  /** reconfigure the` @nx/node:app` to suit firebase functions. */
  updateProject(tree, normalizedOptions)

  /** update firebase functions config. */
  addFunctionConfig(tree, normalizedOptions)

  /** ensures newly added files are formatted to match workspace style. */
  if (!options.skipFormat) {
    await formatFiles(tree)
  }

  return runTasksInSerial(initTask, nodeApplicationTask)
}

export default functionGenerator
export const functionSchematic = convertNxGenerator(functionGenerator)
