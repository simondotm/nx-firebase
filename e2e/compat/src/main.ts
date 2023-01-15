/**
 * Custom e2e compatibility test suite for @simondotm/nx-firebase Nx plugin
 * The plugin e2e test suite can be unreliable and has limitations in Jest
 * This script allows us to run full matrix e2e and regression tests of the plugin across:
 * - Node versions 14,16,18
 * - Nx versions against plugin versions
 * - Check firebase deployments in CI environment
 * - We only do light functional tests, this test matrix is for ensuring wide compatibility of plugin generator & executor
 */

import { green, info, red, time } from './app/utils/log'
import { setupNxWorkspace } from './app/setup'
import { testVersions } from './app/versions'
import { clean, testNxVersion } from './app/test'
import { getCache } from './app/utils/cache'

async function main(options: { onlySetup: boolean } = { onlySetup: false }) {
  const t = Date.now()

  const pluginVersion = '0.3.4'

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

  //-----------------------------------------------------------------------
  // setup phase - generates workspaces for each Nx minor release
  //-----------------------------------------------------------------------
  //  gzip's and caches them for re-use
  // splitting the setup phase from the test phase allows us to cache
  // node_modules in CI github actions for this compat test
  for (let i = 0; i < nxReleases.length; ++i) {
    const release = nxReleases[i]
    info(
      `-- ${i + 1}/${
        nxReleases.length
      } --------------------------------------------------------------------------\n`,
    )
    const cache = getCache(release, pluginVersion)
    await setupNxWorkspace(cache)
  }

  //-----------------------------------------------------------------------
  // test phase - tests each Nx minor release
  //-----------------------------------------------------------------------
  if (!options.onlySetup) {
    const errors: string[] = []
    for (let i = 0; i < nxReleases.length; ++i) {
      const release = nxReleases[i]
      info(
        `-- ${i + 1}/${
          nxReleases.length
        } --------------------------------------------------------------------------\n`,
      )
      const cache = getCache(release, pluginVersion)
      const result = await testNxVersion(cache)
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

  //-----------------------------------------------------------------------
  // Complete
  //-----------------------------------------------------------------------
  const dt = Date.now() - t
  info(`Total time ${time(dt)}`)
}

// entry
if (process.argv.length > 2) {
  if (process.argv[2] === '--setup') {
    main({ onlySetup: true })
  } else if (process.argv[2] === '--clean') {
    clean()
  }
} else {
  main()
}
