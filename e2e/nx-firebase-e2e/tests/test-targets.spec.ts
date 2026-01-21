import { uniq } from '@nx/plugin/testing'

import {
  ProjectData,
  appGeneratorAsync,
  cleanAppAsync,
  cleanFunctionAsync,
  functionGeneratorAsync,
  getProjectData,
  runTargetAsync,
  expectStrings,
  testDebug,
} from '../test-utils'

// Ensure daemon is disabled for all e2e tests
beforeAll(() => {
  process.env['CI'] = 'true'
  process.env['NX_DAEMON'] = 'false'
})

// Since targets is the last e2e test suite to run, we can disable cleanup here to leave the e2e
// tmp workspace intact for inspection if needed.
const ENABLE_CLEANUP = false

//--------------------------------------------------------------------------------------------------
// Test app targets
//--------------------------------------------------------------------------------------------------
describe('nx-firebase app targets', () => {
  // Track current test's projects for cleanup
  let currentAppData: ProjectData | null = null
  let currentFunctionData: ProjectData | null = null
  let currentFunctionData2: ProjectData | null = null

  // Only cleanup if enabled
  if (ENABLE_CLEANUP) {
    // Always run cleanup after each test, even on failure
    afterEach(async () => {
      // Clean up functions first (they depend on apps)
      if (currentFunctionData2) {
        try {
          await cleanFunctionAsync(currentFunctionData2)
        } catch (e) {
          testDebug(`Function2 cleanup warning: ${(e as Error).message}`)
        }
        currentFunctionData2 = null
      }
      if (currentFunctionData) {
        try {
          await cleanFunctionAsync(currentFunctionData)
        } catch (e) {
          testDebug(`Function cleanup warning: ${(e as Error).message}`)
        }
        currentFunctionData = null
      }
      // Then clean up app
      if (currentAppData) {
        try {
          await cleanAppAsync(currentAppData)
        } catch (e) {
          testDebug(`App cleanup warning: ${(e as Error).message}`)
        }
        currentAppData = null
      }
    
    })
  }
  it('should run lint target for app', async () => {
    currentAppData = getProjectData('apps', uniq('firebaseTargetsApp'))
    currentFunctionData = getProjectData('apps', uniq('firebaseTargetsFunction'))
    currentFunctionData2 = getProjectData(
      'apps',
      uniq('firebaseTargetsFunction'),
    )
    await appGeneratorAsync(currentAppData)
    await functionGeneratorAsync(
      currentFunctionData,
      `--app ${currentAppData.projectName}`,
    )
    await functionGeneratorAsync(
      currentFunctionData2,
      `--app ${currentAppData.projectName}`,
    )

    const result = await runTargetAsync(currentAppData, 'lint')
    expectStrings(result.stdout, [
      `nx run ${currentAppData.projectName}:lint`,
      `nx run ${currentFunctionData.projectName}:lint`,
      `nx run ${currentFunctionData2.projectName}:lint`,
      // SM March 2024: The firebase SDK templates dont pass linting !
      // `All files pass linting`,
      `Successfully ran target lint for 2 projects`,
      `Successfully ran target lint for project ${currentAppData.projectName}`,
    ])
  })

  it('should run test target for app', async () => {
    currentAppData = getProjectData('apps', uniq('firebaseTargetsApp'))
    currentFunctionData = getProjectData('apps', uniq('firebaseTargetsFunction'))
    currentFunctionData2 = getProjectData(
      'apps',
      uniq('firebaseTargetsFunction'),
    )
    await appGeneratorAsync(currentAppData)
    await functionGeneratorAsync(
      currentFunctionData,
      `--app ${currentAppData.projectName}`,
    )
    await functionGeneratorAsync(
      currentFunctionData2,
      `--app ${currentAppData.projectName}`,
    )

    const result = await runTargetAsync(currentAppData, 'test')
    expectStrings(result.stdout, [
      `nx run ${currentAppData.projectName}:test`,
      `Running target test for 2 projects`,
      `nx run ${currentFunctionData.projectName}:test`,
      `nx run ${currentFunctionData2.projectName}:test`,
      `Successfully ran target test for 2 projects`,
      `Successfully ran target test for project ${currentAppData.projectName}`,
    ])
  })

  it('should run deploy target for app', async () => {
    currentAppData = getProjectData('apps', uniq('firebaseTargetsApp'))
    currentFunctionData = getProjectData('apps', uniq('firebaseDepsFunction'))
    currentFunctionData2 = getProjectData('apps', uniq('firebaseDepsFunction'))
    await appGeneratorAsync(currentAppData)
    await functionGeneratorAsync(
      currentFunctionData,
      `--app ${currentAppData.projectName}`,
    )
    await functionGeneratorAsync(
      currentFunctionData2,
      `--app ${currentAppData.projectName}`,
    )

    // deploy target will fail because theres no firebase project but thats ok
    // we cannot e2e a real firebase project setup atm
    const result = await runTargetAsync(currentAppData, 'deploy')
    expectStrings(result.stdout, [
      `Running target deploy for project ${currentAppData.projectName}`,
      `nx run ${currentAppData.projectName}:deploy`,
      `nx run ${currentAppData.projectName}:firebase deploy`,
    ])
    // build target will also execute, since functions are implicit dep of app
    // In Nx 17+, when build runs as a dependency of deploy, all output goes to stdout
    expectStrings(result.stdout, [
      `nx run ${currentAppData.projectName}:build`,
      `nx run ${currentFunctionData.projectName}:build`,
      `nx run ${currentFunctionData2.projectName}:build`,
      `Build succeeded`,
      `${currentFunctionData.distDir}/main.js`,
      `${currentFunctionData2.distDir}/main.js`,
    ])
  })

  it('should run deploy target for function', async () => {
    currentAppData = getProjectData('apps', uniq('firebaseTargetsApp'))
    currentFunctionData = getProjectData(
      'apps',
      uniq('firebaseTargetsFunction'),
    )
    await appGeneratorAsync(currentAppData)
    await functionGeneratorAsync(
      currentFunctionData,
      `--app ${currentAppData.projectName}`,
    )

    const result = await runTargetAsync(currentFunctionData, 'deploy')
    expectStrings(result.stdout, [
      `Running target deploy for project ${currentFunctionData.projectName}`,
      `nx run ${currentAppData.projectName}:deploy`,
      `nx run ${currentAppData.projectName}:firebase deploy`,
    ])
    // build target will also execute, since functions are implicit dep of app
    expectStrings(result.stdout, [
      `nx run ${currentFunctionData.projectName}:build`,
      `Build succeeded`,
    ])
    expectStrings(result.stderr, [`${currentFunctionData.distDir}/main.js`])
  })
})
