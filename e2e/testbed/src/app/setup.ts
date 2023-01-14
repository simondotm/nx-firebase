// setup re-usable workspaces for e2e testbed
import { red } from './colours'
import { defaultCwd, rootDir } from './cwd'
import { customExec } from './exec'
import { info, log, setLogFile } from './log'
import { nxReleases } from './nx-releases'
import { deleteDir, deleteFile, ensureDir, fileExists, setCwd } from './utils'
import { createTestDir, createWorkspace, workspaceExists } from './workspace'

export async function setupNxWorkspace(
  nxVersion: string,
  pluginVersion: string,
) {
  try {
    // setup the target Nx workspace
    const testDir = `${rootDir}/${nxVersion}`
    const workspaceDir = `${testDir}/myorg`
    const archiveFile = `${rootDir}/${nxVersion}.tar.gz`

    const archiveExists = fileExists(archiveFile)

    info(
      `${
        archiveExists ? 'UNPACKING' : 'INSTALLING'
      } NX VERSION '${nxVersion}' WITH PLUGIN VERSION '${pluginVersion}'\n`,
    )

    ensureDir(`${defaultCwd}/node_modules/.cache`)
    ensureDir(`${defaultCwd}/node_modules/.cache/nx-firebase`)

    setLogFile(`${rootDir}/${nxVersion}.log.txt`)

    log(
      `Creating new Nx workspace version ${nxVersion} in directory '${testDir}'`,
    )

    // create workspace & archive if it doesn't already exist
    if (!archiveExists) {
      createTestDir(testDir)
      // if (!workspaceExists(workspaceDir)) {
      await createWorkspace(nxVersion, workspaceDir, pluginVersion)
      if (fileExists(archiveFile)) {
        deleteFile(archiveFile)
      }
      // } else {
      //   log(`workspace already exists for ${workspaceDir}`)
      // }
      // cwd is workspaceDir
      setCwd(`${rootDir}`)
      await customExec(`tar -zcf ${archiveFile} ./${nxVersion}`) // add -v for verbose
      deleteDir(testDir)
    } else {
      log(
        `workspace archive already exists for ${workspaceDir}, no setup required`,
      )
    }

    // // wipe node_modules from our cached workspace
    // deleteDir(`${workspaceDir}/node_modules`)

    // info(`SETUP VERSION '${nxVersion}' SUCCEEDED\n`)
  } catch (err) {
    info(err.message)
    info(red(`SETUP VERSION '${nxVersion}' FAILED\n`))
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
