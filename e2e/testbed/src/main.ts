/**
 * Custom e2e compatibility test suite for @simondotm/nx-firebase Nx plugin
 * The plugin e2e test suite can be unreliable and has limitations in Jest
 * This script allows us to run full matrix e2e and regression tests of the plugin across:
 * - Node versions 14,16,18
 * - Nx versions against plugin versions
 * - Check firebase deployments in CI environment
 * - We only do light functional tests, this test matrix is for ensuring wide compatibility of plugin generator & executor
 */

import { info, log, setLogFile } from './app/log'
import { deleteDir, setCwd } from './app/utils'
import { createTestDir, createWorkspace } from './app/workspace'
import { rootDir } from './app/cwd'
import { setupAll, setupNxWorkspace } from './app/setup'
import { nxReleases } from './app/versions'
import { testPlugin } from './app/test'
import { green, red } from './app/colours'
import { customExec } from './app/exec'

async function testNxVersion(nxVersion: string, pluginVersion: string) {
  let error: string | undefined

  const t = Date.now()

  const testDir = `${rootDir}/${nxVersion}`
  const workspaceDir = `${testDir}/myorg`
  const archiveFile = `${rootDir}/${nxVersion}.tar.gz`

  setLogFile(`${rootDir}/${nxVersion}.e2e.txt`)

  try {
    info(
      `TESTING NX VERSION '${nxVersion}' AGAINST PLUGIN VERSION '${pluginVersion}'\n`,
    )

    // cleanup
    setCwd(rootDir)
    deleteDir(testDir)

    // unpack the archive
    setCwd(rootDir)
    await customExec(`tar -xzf ${archiveFile}`) // add -v for verbose

    // run the plugin test suite
    setCwd(workspaceDir)
    await testPlugin(workspaceDir)

    info(green(`TESTING VERSION '${nxVersion}' SUCCEEDED\n`))
  } catch (err) {
    info(err.message)
    info(
      red(`TESTING VERSION '${nxVersion}' FAILED - INCOMPATIBILITY DETECTED\n`),
    )
    error = err.message
  }

  // cleanup
  setCwd(rootDir)
  deleteDir(testDir)

  const dt = Date.now() - t
  info(`Completed in ${dt}ms\n`)

  return error
}

async function main(options: { onlySetup: boolean } = { onlySetup: false }) {
  const t = Date.now()
  // await testNxVersion('13.10.6', '0.3.4')
  //   await testNxVersion('14.8.6', '0.3.4')
  //   await testNxVersion('15.3.3', '0.3.4')
  //   await testNxVersion('15.4.5', '0.3.4')

  const releases: string[] = []

  for (const maj in nxReleases) {
    const majVersions = nxReleases[maj]
    for (const min in majVersions) {
      const patchVersions = majVersions[min]
      const latestVersion = patchVersions[patchVersions.length - 1]
      const version = `${maj}.${min}.${latestVersion}`
      releases.push(version)
    }
  }

  // setup phase - generates workspaces for each Nx minor release
  //  gzip's and caches them for re-use
  // splitting the setup phase from the test phase allows us to cache
  // node_modules in CI github actions for this compat test
  for (let i = 0; i < releases.length; ++i) {
    const release = releases[i]
    info(
      `-- ${i + 1}/${
        releases.length
      } --------------------------------------------------------------------------\n`,
    )
    await setupNxWorkspace(release, '0.3.4')
  }

  if (!options.onlySetup) {
    // test phase - tests each Nx minor release
    const errors: string[] = []
    for (let i = 0; i < releases.length; ++i) {
      const release = releases[i]
      info(
        `-- ${i + 1}/${
          releases.length
        } --------------------------------------------------------------------------\n`,
      )
      const result = await testNxVersion(release, '0.3.4')
      if (result) {
        errors.push(result)
      }
    }

    if (errors.length) {
      info(red('TEST ERRORS:`n'))
      for (const error of errors) {
        info(red(error))
      }
    } else {
      info(green('ALL TESTS SUCCEEDED'))
    }
  }

  const dt = Date.now() - t
  info(`Total time ${dt}ms`)
}

if (process.argv.length > 2 && process.argv[2] === '--setup') {
  main({ onlySetup: true })
} else {
  main()
}
