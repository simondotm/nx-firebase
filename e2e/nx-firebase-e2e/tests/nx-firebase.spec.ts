import {
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  updateFile,
} from '@nx/plugin/testing'

import { testWorkspace } from './test-workspace'
import { testLibraries } from './test-libraries'
import { testFunction } from './test-function'
import { testApplication } from './test-application'
import { testBundler } from './test-bundler'
import { testSync } from './test-sync'
import { testTargets } from './test-targets'
import { testMigrate } from './test-migrate'

/**
 * Nx 16.8.1 is giving me a massive headache with the daemon running during e2e tests
 * We get missing projects and LOCK_FILE_CHANGED errors
 * So we force CI environment variable to be true to ensure it is disabled
 * At least this way we know what runs locally will also match in actual CI environments
 * https://nx.dev/concepts/more-concepts/nx-daemon#turning-it-off
 */
process.env['CI'] = 'true'

const JEST_TIMEOUT = 190000
jest.setTimeout(JEST_TIMEOUT)

// NOTE: If one e2e test fails, cleanup fails, so all subsequent tests will fail.

// DONE
// not gonna test watch, serve, emulate, killports, getconfig
// check that deploy runs the application deploy
// check that lint works for functions & apps
// check that test works for functions & apps
// check that serve works for apps
// remove all tests related to old plugin
// dont check anything that the generator tests already test, this is just e2e
// check all options
// check dependent packages are installed
// check that functions are added
// check that functions build
// check all build artefacts are correct
// check that libraries can be buildable and non-buildable
// check that build includes building of dependent functions

const pluginName = '@simondotm/nx-firebase'
const pluginPath = 'dist/packages/nx-firebase'
const workspaceLayout = {
  appsDir: 'apps',
  libsDir: 'libs',
}

describe('nx-firebase e2e', () => {
  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependant on one another.
  beforeAll(async () => {
    ensureNxProject(pluginName, pluginPath)

    /** Nx 16.8.1 defaults to as-provided, lets override this for my own sanity */
    updateFile('nx.json', (text) => {
      const json = JSON.parse(text)
      console.debug(json)
      json.workspaceLayout = workspaceLayout
      // Disabling daemon for e2e tests as well, even though CI is enabled
      json['tasksRunnerOptions'] ??= {
        default: {
          useDaemonProcess: false,
        },
      }
      return JSON.stringify(json, null, 2)
    })
    /* ensure daemon is off for e2e test */
    await runNxCommandAsync('reset')
  }, JEST_TIMEOUT)

  afterAll(async () => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    await runNxCommandAsync('reset')
  })

  // test to ensure workspace setup is working
  describe('ensureNxProject workspace', () => {
    it('should successfuly configure workspace layout', () => {
      const nxJson = readJson('nx.json')
      expect(nxJson.workspaceLayout).toMatchObject(workspaceLayout)
      expect(nxJson.tasksRunnerOptions.default.useDaemonProcess).toBe(false)
    })
  })

  /** Run test suites */
  testWorkspace()
  testLibraries()
  testApplication()
  testFunction()
  testBundler()
  testSync()
  testTargets()
  testMigrate()
})
