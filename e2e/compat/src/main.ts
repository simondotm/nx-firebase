/**
 * Custom e2e compatibility test suite for @simondotm/nx-firebase Nx plugin
 * The plugin e2e test suite can be unreliable and has limitations in Jest
 * This script allows us to run full matrix e2e and regression tests of the plugin across:
 * - Node versions 14,16,18
 * - Nx versions against plugin versions
 * - Check firebase deployments in CI environment
 * - We only do light functional tests, this test matrix is for ensuring wide compatibility of plugin generator & executor
 */

import { green, info, log, red, setLogFile, time } from './app/utils/log'
import { setupNxWorkspace } from './app/setup'
import { testVersions } from './app/versions'
import { clean, testNxVersion } from './app/test'
import { getCache } from './app/utils/cache'
import { customExec } from './app/utils/exec'
import { defaultCwd } from './app/utils/cwd'
import { exit } from 'process'

// Force CI environment if necessary
// process.env.CI = 'true'
// process.env.NX_DAEMON = 'false'

type CmdOptions = {
  onlySetup: boolean
  force: boolean
  clean: boolean
}

async function main(options: CmdOptions) {
  const t = Date.now()

  const pluginVersions = testVersions.pluginVersions

  // gather all nx versions in the test matrix
  const nxReleases: string[] = []
  for (const maj in testVersions.nxReleases) {
    const majVersions = testVersions.nxReleases[maj]
    for (const min in majVersions) {
      const patchVersions = majVersions[min]
      const latestVersion = patchVersions[patchVersions.length - 1]
      const version = `${maj}.${min}.${latestVersion}`
      nxReleases.push(version)
    }
  }

  info(`Packing plugin '${defaultCwd}/dist/packages/nx-firebase'...`)
  await customExec(`npm pack`, `${defaultCwd}/dist/packages/nx-firebase`)

  //-----------------------------------------------------------------------
  // setup phase - generates workspaces for each Nx minor release
  //-----------------------------------------------------------------------
  //  gzip's and caches them for re-use
  // splitting the setup phase from the test phase allows us to cache
  // node_modules in CI github actions for this compat test
  const testMatrixSize = nxReleases.length * pluginVersions.length * 2 // 2 = setup+test

  //-----------------------------------------------------------------------
  // test phase - tests each Nx minor release
  //-----------------------------------------------------------------------
  let testCounter = 0
  const errors: string[] = []
  for (let i = 0; i < nxReleases.length; ++i) {
    for (const pluginVersion of pluginVersions) {
      const release = nxReleases[i]

      //-----------------------------------------------------------------------
      // setup phase - generates workspaces for each Nx minor release
      //-----------------------------------------------------------------------
      //  gzip's and caches them for re-use
      // splitting the setup phase from the test phase allows us to cache
      // node_modules in CI github actions for this compat test

      const cache = getCache(release, pluginVersion)

      setLogFile(`${cache.rootDir}/${cache.nxVersion}.log.txt`)

      info(
        `-- ${
          testCounter + 1
        }/${testMatrixSize} --------------------------------------------------------------------------\n`,
      )

      await setupNxWorkspace(cache, options.force)
      ++testCounter

      //-----------------------------------------------------------------------
      // test phase - tests each Nx minor release
      //-----------------------------------------------------------------------
      info(
        `-- ${
          testCounter + 1
        }/${testMatrixSize} --------------------------------------------------------------------------\n`,
      )

      if (!options.onlySetup) {
        const result = await testNxVersion(cache)
        if (result) {
          errors.push(result)
        }
      }
      ++testCounter
    }
  }

  // report error summary
  if (errors.length) {
    info(red('TEST ERRORS:`n'))
    for (const error of errors) {
      info(red(error))
    }
  } else {
    info(green('ALL TESTS SUCCEEDED'))
  }

  //-----------------------------------------------------------------------
  // Complete
  //-----------------------------------------------------------------------
  const dt = Date.now() - t
  info(`Total time ${time(dt)}`)
}

// entry
const options: CmdOptions = { onlySetup: false, force: false, clean: false }
if (process.argv.length > 2) {
  if (process.argv[2] === '--setup') {
    options.onlySetup = true
  } else if (process.argv[2] === '--clean') {
    options.clean = true
  } else if (process.argv[2] === '--force') {
    options.force = true
  }
}

if (options.clean) {
  clean()
} else {
  main(options)
}
