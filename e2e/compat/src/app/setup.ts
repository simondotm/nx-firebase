// setup re-usable workspaces for e2e testbed
import { customExec } from './utils/exec'
import { green, info, log, red, setLogFile } from './utils/log'
import {
  deleteDir,
  deleteFile,
  ensureDir,
  fileExists,
  setCwd,
} from './utils/utils'
import { createTestDir, createWorkspace } from './workspace'
import { Cache } from './utils/cache'

/**
 * Generate an NxWorkspace with the given versions and gzip it
 * unless the gzip archive of a version already exists
 * @param nxVersion - target nx version eg. '13.10.6'
 * @param pluginVersion - target nx-firebase version eg. '0.3.4'
 * @param force - always recreate the workspace
 */
export async function setupNxWorkspace(cache: Cache, force = false) {
  try {
    // setup the target Nx workspace
    const archiveExists = fileExists(cache.archiveFile) && !force

    info(
      `SETUP NX VERSION '${cache.nxVersion}' WITH PLUGIN VERSION '${
        cache.pluginVersion
      }' ${archiveExists ? '[CACHED]' : 'INSTALLING'}\n`,
    )

    ensureDir(cache.rootDir)

    info(
      `Creating new Nx workspace version ${cache.nxVersion} in directory '${cache.testDir}'`,
    )

    // create workspace & archive if it doesn't already exist
    if (!archiveExists) {
      deleteDir(cache.testDir)
      createTestDir(cache.testDir)
      await createWorkspace(cache)

      // delete any existing archive file so we do not accidentally append to archive
      if (fileExists(cache.archiveFile)) {
        deleteFile(cache.archiveFile)
      }

      // cwd is workspaceDir
      setCwd(cache.rootDir)
      // archive the workspace
      await customExec(`tar -zcf ${cache.archiveFile} ./${cache.nxVersion}`) // add -v for verbose
      deleteDir(cache.testDir)
    } else {
      log(
        `Workspace archive '${cache.archiveFile}' already exists for '${cache.workspaceDir}', no setup required`,
      )
    }
    info(green(`SETUP VERSION '${cache.nxVersion}' SUCCEEDED\n`))
  } catch (err) {
    info(err.message)
    info(red(`SETUP VERSION '${cache.nxVersion}' FAILED\n`))
    // escalate, this is a show stopper
    throw err
  }
}
