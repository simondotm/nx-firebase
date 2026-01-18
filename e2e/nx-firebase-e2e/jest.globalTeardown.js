/**
 * Global teardown for e2e tests - runs once after all test files
 * Cleans up the e2e test workspace
 */
const { runNxCommandAsync } = require('@nx/plugin/testing')

module.exports = async function globalTeardown() {
  console.log('\n[Global Teardown] Cleaning up...\n')

  try {
    // `nx reset` kills the daemon and performs cleanup
    await runNxCommandAsync('reset')
  } catch (e) {
    console.log('Teardown warning:', e.message)
  }

  console.log('\n[Global Teardown] Complete\n')
}
