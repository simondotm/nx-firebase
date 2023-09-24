import { GeneratorCallback, logger, runTasksInSerial, Tree } from '@nx/devkit'

import { MigrateGeneratorSchema } from './schema'
import initGenerator from '../init/init'

import { debugInfo, getFirebaseWorkspace } from '../sync/lib'
import { runMigrations } from './lib/migrate'

/**
 * Migrate firebase workspace
 *
 */
export default async function migrateGenerator(
  tree: Tree,
  // eslint-disable-next-line
  options: MigrateGeneratorSchema,
): Promise<GeneratorCallback> {
  const tasks: GeneratorCallback[] = []

  // initialise plugin
  const initTask = await initGenerator(tree, {})
  tasks.push(initTask)

  // otherwise, sync the workspace.
  // build lists of firebase apps & functions that have been deleted or renamed
  debugInfo('- Migrating workspace')

  const workspace = getFirebaseWorkspace(tree)

  logger.info(
    `This workspace has ${workspace.firebaseAppProjects.size} firebase apps and ${workspace.firebaseFunctionProjects.size} firebase functions\n\n`,
  )

  runMigrations(tree, workspace)

  return runTasksInSerial(...tasks)
}
