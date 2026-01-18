/**
 * Global setup for e2e tests - runs once before all test files
 * Creates and configures the e2e test workspace
 */
const {
  ensureNxProject,
  updateFile,
  runNxCommandAsync,
} = require('@nx/plugin/testing')

const pluginName = '@simondotm/nx-firebase'
const pluginPath = 'dist/packages/nx-firebase'

const workspaceLayout = {
  appsDir: 'apps',
  libsDir: 'libs',
  projectNameAndRootFormat: 'derived',
}

module.exports = async function globalSetup() {
  console.log('\n[Global Setup] Creating e2e test workspace...\n')

  // Ensure daemon is disabled
  process.env['CI'] = 'true'
  process.env['NX_DAEMON'] = 'false'

  // Create the e2e workspace with the plugin
  ensureNxProject(pluginName, pluginPath)

  // Configure workspace layout for consistent project naming
  updateFile('nx.json', (text) => {
    const json = JSON.parse(text)
    json.workspaceLayout = workspaceLayout
    // Nx 17+ uses root-level useDaemonProcess instead of tasksRunnerOptions.default
    json.useDaemonProcess = false
    return JSON.stringify(json, null, 2)
  })

  // Reset nx to ensure clean state
  await runNxCommandAsync('reset')

  console.log('\n[Global Setup] Workspace ready\n')
}
