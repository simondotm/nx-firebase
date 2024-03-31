import { generateFiles, joinPathFragments, Tree } from '@nx/devkit'

import type { NormalizedSchema } from '../schema'

/**
 * Generate the firebase app specific files
 *
 * @param tree
 * @param options
 */
export function createFiles(tree: Tree, options: NormalizedSchema): void {
  const firebaseAppConfig = options.firebaseConfigName

  const substitutions = {
    tmpl: '',
    projectName: options.projectName,
    projectRoot: options.projectRoot,
    firebaseAppConfig,
  }

  // The default functions package.json & templated typescript source files are added here
  // to match the `firebase init` cli setup
  // if the user isn't using functions, they can just delete and update their firebase config accordingly
  //
  // Rules and index files also get generated in the application folder;
  // 1. so that they dont clutter up the root workspace
  // 2. so that they are located within the nx firebase application project they relate to
  generateFiles(
    tree,
    joinPathFragments(__dirname, '..', 'files'),
    options.projectRoot,
    substitutions,
  )

  // The first firebase app project in a workspace will always use `firebase.json` as its config file
  // Subsequent firebase app projects will be assigned a config file based on the project name, so `firebase.<project-name>.json`
  if (firebaseAppConfig === 'firebase.json') {
    //  if (!tree.exists('firebase.json')) {
    generateFiles(
      tree,
      joinPathFragments(__dirname, '..', 'files_firebase'),
      '',
      substitutions,
    )
  } else {
    generateFiles(
      tree,
      joinPathFragments(__dirname, '..', 'files_workspace'),
      '', // SM: this is a tree path, not a file system path
      substitutions,
    )
  }

  // For a fresh workspace, the firebase CLI needs at least a firebase.json and an empty .firebaserc
  //  in order to use commands like 'firebase use --add'
  if (!tree.exists('.firebaserc')) {
    generateFiles(
      tree,
      joinPathFragments(__dirname, '..', 'files_firebaserc'),
      '',
      substitutions,
    )
  }
  // else {
  //   logger.log('✓ .firebaserc already exists in this workspace')
  // }
}
