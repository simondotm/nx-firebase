import { uniq } from '@nx/plugin/testing'

import {
  appGeneratorAsync,
  cleanAppAsync,
  cleanFunctionAsync,
  functionGeneratorAsync,
  getProjectData,
  runTargetAsync,
  expectStrings,
} from '../test-utils'

//--------------------------------------------------------------------------------------------------
// Test app targets
//--------------------------------------------------------------------------------------------------
export function testTargets() {
  describe('nx-firebase app targets', () => {
    it('should run lint target for app', async () => {
      const appData = getProjectData('apps', uniq('firebaseTargetsApp'))
      const functionData = getProjectData(
        'apps',
        uniq('firebaseTargetsFunction'),
      )
      const functionData2 = getProjectData(
        'apps',
        uniq('firebaseTargetsFunction'),
      )
      await appGeneratorAsync(appData)
      await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)
      await functionGeneratorAsync(
        functionData2,
        `--app ${appData.projectName}`,
      )

      const result = await runTargetAsync(appData, 'lint')
      expectStrings(result.stdout, [
        `nx run ${appData.projectName}:lint`,
        `nx run ${functionData.projectName}:lint`,
        `nx run ${functionData2.projectName}:lint`,
        // SM March 2024: The firebase SDK templates dont pass linting !
        // `All files pass linting`,
        `Successfully ran target lint for 2 projects`,
        `Successfully ran target lint for project ${appData.projectName}`,
      ])

      // cleanup
      await cleanFunctionAsync(functionData2)
      await cleanFunctionAsync(functionData)
      await cleanAppAsync(appData)
    })

    it('should run test target for app', async () => {
      const appData = getProjectData('apps', uniq('firebaseTargetsApp'))
      const functionData = getProjectData(
        'apps',
        uniq('firebaseTargetsFunction'),
      )
      const functionData2 = getProjectData(
        'apps',
        uniq('firebaseTargetsFunction'),
      )
      await appGeneratorAsync(appData)
      await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)
      await functionGeneratorAsync(
        functionData2,
        `--app ${appData.projectName}`,
      )

      const result = await runTargetAsync(appData, 'test')
      expectStrings(result.stdout, [
        `nx run ${appData.projectName}:test`,
        `Running target test for 2 projects`,
        `nx run ${functionData.projectName}:test`,
        `nx run ${functionData2.projectName}:test`,
        `Successfully ran target test for 2 projects`,
        `Successfully ran target test for project ${appData.projectName}`,
      ])

      // cleanup
      await cleanFunctionAsync(functionData2)
      await cleanFunctionAsync(functionData)
      await cleanAppAsync(appData)
    })

    it('should run deploy target for app', async () => {
      const appData = getProjectData('apps', uniq('firebaseTargetsApp'))
      const functionData = getProjectData('apps', uniq('firebaseDepsFunction'))
      const functionData2 = getProjectData('apps', uniq('firebaseDepsFunction'))
      await appGeneratorAsync(appData)
      await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)
      await functionGeneratorAsync(
        functionData2,
        `--app ${appData.projectName}`,
      )

      // deploy target will fail because theres no firebase project but thats ok
      // we cannot e2e a real firebase project setup atm
      const result = await runTargetAsync(appData, 'deploy')
      expectStrings(result.stdout, [
        `Running target deploy for project ${appData.projectName}`,
        `nx run ${appData.projectName}:deploy`,
        `nx run ${appData.projectName}:firebase deploy`,
      ])
      // build target will also execute, since functions are implicit dep of app
      expectStrings(result.stdout, [
        `nx run ${appData.projectName}:build`,
        `nx run ${functionData.projectName}:build`,
        `nx run ${functionData2.projectName}:build`,
        `Build succeeded`,
      ])
      expectStrings(result.stderr, [
        `${functionData.distDir}/main.js`,
        `${functionData2.distDir}/main.js`,
      ])
      // cleanup
      await cleanFunctionAsync(functionData2)
      await cleanFunctionAsync(functionData)
      await cleanAppAsync(appData)
    })

    it('should run deploy target for function', async () => {
      const appData = getProjectData('apps', uniq('firebaseTargetsApp'))
      const functionData = getProjectData(
        'apps',
        uniq('firebaseTargetsFunction'),
      )
      await appGeneratorAsync(appData)
      await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)

      const result = await runTargetAsync(functionData, 'deploy')
      expectStrings(result.stdout, [
        `Running target deploy for project ${functionData.projectName}`,
        `nx run ${appData.projectName}:deploy`,
        `nx run ${appData.projectName}:firebase deploy`,
      ])
      // build target will also execute, since functions are implicit dep of app
      expectStrings(result.stdout, [
        `nx run ${functionData.projectName}:build`,
        `Build succeeded`,
      ])
      expectStrings(result.stderr, [`${functionData.distDir}/main.js`])

      // cleanup
      await cleanFunctionAsync(functionData)
      await cleanAppAsync(appData)
    })
  })
}
