// setup re-usable workspaces for e2e testbed
import { green, red } from './colours'
import { customExec } from './exec'
import { info, log, setLogFile } from './log'
import { deleteDir, deleteFile, ensureDir, fileExists, setCwd } from './utils'
import { createTestDir, createWorkspace } from './workspace'
import { getCache } from './cache'

/**
 * Generate an NxWorkspace with the given versions and gzip it
 * unless the gzip archive of a version already exists
 * @param nxVersion - target nx version eg. '13.10.6'
 * @param pluginVersion - target nx-firebase version eg. '0.3.4'
 * @param force - always recreate the workspace
 */
export async function setupNxWorkspace(
  nxVersion: string,
  pluginVersion: string,
  force = false,
) {
  const cache = getCache(nxVersion, pluginVersion)

  try {
    // setup the target Nx workspace
    const archiveExists = fileExists(cache.archiveFile) && !force

    info(
      `SETUP NX VERSION '${nxVersion}' WITH PLUGIN VERSION '${pluginVersion}' ${
        archiveExists ? '[CACHED]' : 'INSTALLING'
      }\n`,
    )

    ensureDir(cache.rootDir)

    setLogFile(`${cache.rootDir}/${nxVersion}.log.txt`)

    log(
      `Creating new Nx workspace version ${nxVersion} in directory '${cache.testDir}'`,
    )

    // create workspace & archive if it doesn't already exist
    if (!archiveExists) {
      deleteDir(cache.testDir)
      createTestDir(cache.testDir)
      await createWorkspace(nxVersion, cache.workspaceDir, pluginVersion)
      // delete any existing archive file so we do not accidentally append to archive
      if (fileExists(cache.archiveFile)) {
        deleteFile(cache.archiveFile)
      }

      // cwd is workspaceDir
      setCwd(cache.rootDir)
      // archive the workspace
      await customExec(`tar -zcf ${cache.archiveFile} ./${nxVersion}`) // add -v for verbose
      deleteDir(cache.testDir)
    } else {
      log(
        `WQokspace archive '${cache.archiveFile}' already exists for '${cache.workspaceDir}', no setup required`,
      )
    }
    info(green(`SETUP VERSION '${nxVersion}' SUCCEEDED\n`))
  } catch (err) {
    info(err.message)
    info(red(`SETUP VERSION '${nxVersion}' FAILED\n`))
    // escalate, this is a show stopper
    throw err
  }
}
