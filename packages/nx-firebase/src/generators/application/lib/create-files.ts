import type { Tree } from '@nrwl/devkit'
import {
  generateFiles,
  joinPathFragments,
  workspaceRoot,
  logger,
} from '@nrwl/devkit'
import type { NormalizedOptions } from '../schema'
import { relative } from 'path'

/**
 * Generate the firebase app specific files
 *
 * @param tree
 * @param options
 */
export function createFiles(tree: Tree, options: NormalizedOptions): void {
  const firebaseAppConfig = `firebase.${options.name}.json`
  const firebaseAppConfigPath = relative(
    options.appProjectRoot,
    joinPathFragments(workspaceRoot, firebaseAppConfig),
  )

  const substitutions = {
    tmpl: '',
    name: options.name,
    root: options.appProjectRoot,

    firebaseAppName: options.name,
    firebaseAppConfig,
    firebaseAppConfigPath,
  }

  // The default functions package.json & templated typescript source files are added here
  // to match the `firebase init` cli setup
  // if the user isn't using functions, they can just delete and update their firebase config accordingly
  //
  // Rules and index files also get generated in the application folder;
  // 1. so that they dont clutter up the root workspace
  // 2. so that they are located cwithin the nx firebase application project they relate to
  generateFiles(
    tree,
    joinPathFragments(__dirname, '..', 'files'),
    options.appProjectRoot,
    substitutions,
  )

  // create firebase.<__name__>.json config file in the root of the workspace.
  // app project, so that it can be easily located with the cli command, and also enables nx workspaces
  // to contain multiple firebase projects
  // firebase.*.json files have to go in the root of the workspace, because firebase function deployment only allows
  //  the deployed package for functions to exist in a sub directory from where the firebase.json config is located
  // In principle for users that are not using the firebase functions feature, they could put this firebase.json config
  //  inside their app folder, but it's better to have consistent behaviour for every workspace
  generateFiles(
    tree,
    joinPathFragments(__dirname, '..', 'files_workspace'),
    '', // SM: this is a tree path, not a file system path
    substitutions,
  )

  // generate these firebase files in the root workspace only if they dont already exist
  // ( since we dont want to overwrite any existing configs)
  // For a fresh workspace, the firebase CLI needs at least an empty firebase.json and an empty .firebaserc
  //  in order to use commands like 'firebase use --add'
  // firebase.json is an annoying artefact of this requirement, as it isn't actually used by our firebase apps
  //  which each have their own firebase.<appname>.json config
  if (!tree.isFile('firebase.json')) {
    generateFiles(
      tree,
      joinPathFragments(__dirname, '..', 'files_firebase'),
      '',
      substitutions,
    )
  } else {
    logger.log('✓ firebase.json already exists in this workspace')
  }
  if (!tree.exists('.firebaserc')) {
    generateFiles(
      tree,
      joinPathFragments(__dirname, '..', 'files_firebaserc'),
      '',
      substitutions,
    )
  } else {
    logger.log('✓ .firebaserc already exists in this workspace')
  }
}
