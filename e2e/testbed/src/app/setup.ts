// setup re-usable workspaces for e2e testbed
import { red } from './colours'
import { defaultCwd, rootDir } from './cwd'
import { customExec } from './exec'
import { info, log, setLogFile } from './log'
import { nxReleases } from './versions'
import { deleteDir, deleteFile, ensureDir, fileExists, setCwd } from './utils'
import { createTestDir, createWorkspace, workspaceExists } from './workspace'

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
  try {
    // setup the target Nx workspace
    const testDir = `${rootDir}/${nxVersion}`
    const workspaceDir = `${testDir}/myorg`
    const archiveFile = `${rootDir}/${nxVersion}.tar.gz`

    const archiveExists = fileExists(archiveFile) && !force

    info(
      `SETUP NX VERSION '${nxVersion}' WITH PLUGIN VERSION '${pluginVersion}' ${
        archiveExists ? '[CACHED]' : 'INSTALLING'
      }\n`,
    )

    ensureDir(`${defaultCwd}/node_modules/.cache`)
    ensureDir(`${defaultCwd}/node_modules/.cache/nx-firebase`)

    setLogFile(`${rootDir}/${nxVersion}.log.txt`)

    log(
      `Creating new Nx workspace version ${nxVersion} in directory '${testDir}'`,
    )

    // create workspace & archive if it doesn't already exist
    if (!archiveExists) {
      deleteDir(testDir)
      createTestDir(testDir)
      await createWorkspace(nxVersion, workspaceDir, pluginVersion)
      // delete any existing archive file so we do not accidentally append to archive
      if (fileExists(archiveFile)) {
        deleteFile(archiveFile)
      }

      // cwd is workspaceDir
      setCwd(rootDir)
      // archive the workspace
      await customExec(`tar -zcf ${archiveFile} ./${nxVersion}`) // add -v for verbose
      deleteDir(testDir)
    } else {
      log(
        `WQokspace archive '${archiveFile}' already exists for '${workspaceDir}', no setup required`,
      )
    }
    // info(`SETUP VERSION '${nxVersion}' SUCCEEDED\n`)
  } catch (err) {
    info(err.message)
    info(red(`SETUP VERSION '${nxVersion}' FAILED\n`))
    // escalate, this is a show stopper
    throw err
  }
}

export async function setupAll() {
  const t = Date.now()
  // await setupNxWorkspace('13.10.6', '0.3.4')
  //   await testNxVersion('14.8.6', '0.3.4')
  //   await testNxVersion('15.3.3', '0.3.4')
  //   await testNxVersion('15.4.5', '0.3.4')

  let promises: Promise<void>[] = []
  // cant run in parallel unless we are ruthless about setting CWD before every command that could be running concurrently
  const MAX_INSTANCES = 1
  for (const maj in nxReleases) {
    const majVersions = nxReleases[maj]
    for (const min in majVersions) {
      const patchVersions = majVersions[min]
      const latestVersion = patchVersions[patchVersions.length - 1]
      const version = `${maj}.${min}.${latestVersion}`
      promises.push(setupNxWorkspace(version, '0.3.4'))
      if (promises.length >= MAX_INSTANCES) {
        await Promise.all(promises)
        promises = []
      }

      // const patchVersions = majVersions[min]
      // for (const patch of patchVersions) {
      //   const version = `${maj}.${min}.${patch}`
      //   promises.push(setupNxWorkspace(version, '0.3.4'))
      //   if (promises.length >= MAX_INSTANCES) {
      //     await Promise.all(promises)
      //     promises = []
      //   }
      // }
    }
  }
  await Promise.all(promises)
  const dt = Date.now() - t
  info(`Total time ${dt}ms`)
}
