import type { Tree } from '@nrwl/devkit'
import { getWorkspaceLayout, joinPathFragments, names } from '@nrwl/devkit'
import { Linter } from '@nrwl/linter'
import type { Schema as NodeApplicationGeneratorOptions } from '@nrwl/node/src/generators/application/schema'
import type { ApplicationGeneratorOptions, NormalizedOptions } from '../schema'

export function normalizeOptions(
  tree: Tree,
  options: ApplicationGeneratorOptions,
): NormalizedOptions {
  // see https://github.com/nrwl/nx/blob/84cbcb7e105cd2b3bf5b3d84a519e5c52951e0f3/packages/js/src/generators/library/library.ts#L332
  // for how the project name is derived from options.name and --directory
  const name = names(options.name).fileName
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name

  const projectRoot = joinPathFragments(
    getWorkspaceLayout(tree).appsDir,
    projectDirectory,
  )

  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-')

  const firebaseConfigName = tree.exists('firebase.json')
    ? `firebase.${projectName}.json`
    : 'firebase.json'

  // make sure this firebase config name is unique.
  // shouldn't happen as nx already enforces unique project names
  if (tree.exists(firebaseConfigName)) {
    throw Error(
      `There is already a firebase configuration called '${firebaseConfigName}' in this workspace. Please try a different project name.`,
    )
  }

  return {
    ...options,
    projectRoot,
    projectName,
    firebaseConfigName,
    linter: options.linter ?? Linter.EsLint,
    unitTestRunner: options.unitTestRunner ?? 'jest',
  }
}

export function toNodeApplicationGeneratorOptions(
  options: NormalizedOptions,
): NodeApplicationGeneratorOptions {
  return {
    name: options.name,
    directory: options.directory,
    frontendProject: options.frontendProject,
    linter: options.linter,
    skipFormat: true,
    skipPackageJson: options.skipPackageJson,
    standaloneConfig: options.standaloneConfig,
    tags: options.tags,
    unitTestRunner: options.unitTestRunner,
    setParserOptionsProject: options.setParserOptionsProject,
  }
}
