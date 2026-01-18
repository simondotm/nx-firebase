import { readJson, uniq, exists } from '@nx/plugin/testing'

import {
  ProjectData,
  appGeneratorAsync,
  cleanAppAsync,
  cleanFunctionAsync,
  functionGeneratorAsync,
  getProjectData,
  syncGeneratorAsync,
  validateProjectConfig,
  validateFunctionConfig,
  removeProjectAsync,
  renameProjectAsync,
  expectStrings,
  testDebug,
} from '../test-utils'

// Ensure daemon is disabled for all e2e tests
beforeAll(() => {
  process.env['CI'] = 'true'
  process.env['NX_DAEMON'] = 'false'
})

//--------------------------------------------------------------------------------------------------
// Test the nx-firebase sync generator
//--------------------------------------------------------------------------------------------------
describe('nx-firebase sync', () => {
  // Track current test's projects for cleanup
  let currentAppData: ProjectData | null = null
  let currentAppData2: ProjectData | null = null
  let currentFunctionData: ProjectData | null = null
  let currentFunctionData2: ProjectData | null = null
  let renamedAppData: ProjectData | null = null
  let renamedFunctionData: ProjectData | null = null

  // Always run cleanup after each test, even on failure
  afterEach(async () => {
    // Clean up functions first (they depend on apps)
    if (renamedFunctionData) {
      try {
        await cleanFunctionAsync(renamedFunctionData)
      } catch (e) {
        testDebug(`Renamed function cleanup warning: ${(e as Error).message}`)
      }
      renamedFunctionData = null
    }
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
    // Then clean up apps
    if (renamedAppData) {
      try {
        await cleanAppAsync(renamedAppData)
      } catch (e) {
        testDebug(`Renamed app cleanup warning: ${(e as Error).message}`)
      }
      renamedAppData = null
    }
    if (currentAppData2) {
      try {
        await cleanAppAsync(currentAppData2)
      } catch (e) {
        testDebug(`App2 cleanup warning: ${(e as Error).message}`)
      }
      currentAppData2 = null
    }
    if (currentAppData) {
      try {
        await cleanAppAsync(currentAppData)
      } catch (e) {
        testDebug(`App cleanup warning: ${(e as Error).message}`)
      }
      currentAppData = null
    }
  })

  it('should sync firebase workspace with no changes', async () => {
    const result = await syncGeneratorAsync()
    expect(result.stdout).not.toContain('CHANGE')
    expect(result.stdout).not.toContain('UPDATE')
    expect(result.stdout).not.toContain('CREATE')
    expect(result.stdout).not.toContain('DELETE')
  })

  describe('--project', () => {
    it('should set firebase app project using --project', async () => {
      currentAppData = getProjectData('apps', uniq('firebaseSyncApp'))
      await appGeneratorAsync(currentAppData)

      expect(
        readJson(`${currentAppData.projectDir}/project.json`).targets.firebase
          .options.command,
      ).not.toContain(`--project`)
      const result = await syncGeneratorAsync(
        `--app=${currentAppData.projectName} --project=test`,
      )
      expectStrings(result.stdout, [
        `CHANGE setting firebase target --project for '${currentAppData.projectName}' to '--project=test'`,
        `UPDATE apps/${currentAppData.projectName}/project.json`,
      ])
      expect(
        readJson(`${currentAppData.projectDir}/project.json`).targets.firebase
          .options.command,
      ).toContain(`--project=test`)
    })

    it('should update firebase app project using --project', async () => {
      currentAppData = getProjectData('apps', uniq('firebaseSyncApp'))
      await appGeneratorAsync(currentAppData, `--project=test`)

      expect(
        readJson(`${currentAppData.projectDir}/project.json`).targets.firebase
          .options.command,
      ).toContain(`--project=test`)
      const result = await syncGeneratorAsync(
        `--app=${currentAppData.projectName} --project=test2`,
      )
      expectStrings(result.stdout, [
        `CHANGE updating firebase target --project for '${currentAppData.projectName}' to '--project=test2'`,
        `UPDATE apps/${currentAppData.projectName}/project.json`,
      ])
      expect(
        readJson(`${currentAppData.projectDir}/project.json`).targets.firebase
          .options.command,
      ).toContain(`--project=test2`)
    })
  })

  describe('deletions', () => {
    it('should detect deleted firebase functions', async () => {
      currentAppData = getProjectData('apps', uniq('firebaseSyncApp'))
      currentFunctionData = getProjectData('apps', uniq('firebaseSyncFunction'))
      await appGeneratorAsync(currentAppData)
      await functionGeneratorAsync(
        currentFunctionData,
        `--app ${currentAppData.projectName}`,
      )

      await removeProjectAsync(currentFunctionData)
      // Mark as null since we manually removed it
      const removedFunctionData = currentFunctionData
      currentFunctionData = null

      const result = await syncGeneratorAsync()
      expectStrings(result.stdout, [
        `CHANGE Firebase function '${removedFunctionData.projectName}' was deleted, removing function codebase from '${currentAppData.configName}'`,
        `UPDATE ${currentAppData.configName}`,
      ])
    })

    it('should detect deleted firebase apps', async () => {
      currentAppData = getProjectData('apps', uniq('firebaseSyncApp'))
      currentFunctionData = getProjectData('apps', uniq('firebaseSyncFunction'))
      await appGeneratorAsync(currentAppData)
      await functionGeneratorAsync(
        currentFunctionData,
        `--app ${currentAppData.projectName}`,
      )

      await removeProjectAsync(currentAppData)
      // Mark as null since we manually removed it
      const removedAppData = currentAppData
      currentAppData = null

      const result = await syncGeneratorAsync()
      expectStrings(result.stdout, [`DELETE ${removedAppData.configName}`])
      expectStrings(result.stderr, [
        `CHANGE Firebase app '${removedAppData.projectName}' was deleted, firebase:dep tag for firebase function '${currentFunctionData.projectName}' is no longer linked to a Firebase app.`,
      ])
    })

    it('should warn when no firebase apps use firebase.json config', async () => {
      currentAppData = getProjectData('apps', uniq('firebaseSyncApp'))
      currentAppData2 = getProjectData('apps', uniq('firebaseSyncApp'), {
        customConfig: true,
      })
      await appGeneratorAsync(currentAppData)
      await appGeneratorAsync(currentAppData2)

      // delete the app that used firebase.json
      await removeProjectAsync(currentAppData)
      const removedAppData = currentAppData
      currentAppData = null

      const result = await syncGeneratorAsync()
      expectStrings(result.stderr, [
        `None of the Firebase apps in this workspace use 'firebase.json' as their config. Firebase CLI may not work as expected. This can be fixed by renaming the config for one of your firebase projects to 'firebase.json'.`,
      ])
    })
  })

  describe('renames', () => {
    it('should detect renamed firebase functions', async () => {
      currentAppData = getProjectData('apps', uniq('firebaseSyncApp'))
      currentFunctionData = getProjectData('apps', uniq('firebaseSyncFunction'))
      renamedFunctionData = getProjectData('apps', uniq('firebaseSyncFunction'))
      await appGeneratorAsync(currentAppData)
      await functionGeneratorAsync(
        currentFunctionData,
        `--app ${currentAppData.projectName}`,
      )

      expect(
        readJson(`${currentFunctionData.projectDir}/project.json`).targets
          .deploy.options.command,
      ).toContain(`--only functions:${currentFunctionData.projectName}`)

      await renameProjectAsync(currentFunctionData, renamedFunctionData)
      // The original function is now renamed, clear the reference
      const originalFunctionData = currentFunctionData
      currentFunctionData = null

      const result = await syncGeneratorAsync()

      expectStrings(result.stdout, [
        `CHANGE Firebase function '${originalFunctionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated firebase:name tag`,
        `CHANGE Firebase function '${originalFunctionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated codebase in '${currentAppData.configName}'`,
        `CHANGE Firebase function '${originalFunctionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated deploy target to '--only=functions:${renamedFunctionData.projectName}'`,
        `UPDATE apps/${renamedFunctionData.projectName}/project.json`,
        `UPDATE ${currentAppData.configName}`,
      ])

      expect(
        readJson(`${renamedFunctionData.projectDir}/project.json`).targets
          .deploy.options.command,
      ).toContain(`--only functions:${renamedFunctionData.projectName}`)

      validateFunctionConfig(renamedFunctionData, currentAppData)
    })

    it('should detect renamed firebase apps', async () => {
      currentAppData = getProjectData('apps', uniq('firebaseSyncApp'))
      currentFunctionData = getProjectData('apps', uniq('firebaseSyncFunction'))
      currentFunctionData2 = getProjectData(
        'apps',
        uniq('firebaseSyncFunction'),
      )
      renamedAppData = getProjectData('apps', uniq('firebaseSyncApp'))

      await appGeneratorAsync(currentAppData)
      await functionGeneratorAsync(
        currentFunctionData,
        `--app ${currentAppData.projectName}`,
      )
      await functionGeneratorAsync(
        currentFunctionData2,
        `--app ${currentAppData.projectName}`,
      )

      await renameProjectAsync(currentAppData, renamedAppData)
      const originalAppData = currentAppData
      currentAppData = null

      const result = await syncGeneratorAsync()

      expectStrings(result.stdout, [
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:name tag`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated targets`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:dep tag in firebase function '${currentFunctionData.projectName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated environment assets path in firebase function '${currentFunctionData.projectName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:dep tag in firebase function '${currentFunctionData2.projectName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated environment assets path in firebase function '${currentFunctionData2.projectName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated database rules in '${renamedAppData.configName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated firestore rules in '${renamedAppData.configName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated firestore indexes in '${renamedAppData.configName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated storage rules in '${renamedAppData.configName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase deploy command in firebase function '${currentFunctionData.projectName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase deploy command in firebase function '${currentFunctionData2.projectName}'`,
        `UPDATE ${renamedAppData.configName}`,
        `UPDATE apps/${renamedAppData.projectName}/project.json`,
        `UPDATE apps/${currentFunctionData.projectName}/project.json`,
        `UPDATE apps/${currentFunctionData2.projectName}/project.json`,
      ])

      expectStrings(result.stderr, [
        `WARNING: Can't match hosting target with public dir '${originalAppData.projectDir}/public' in '${renamedAppData.configName}' to a project in this workspace. Is it configured correctly?`,
      ])

      // we should not rename config if it is called firebase.json
      expect(result.stdout).not.toContain(
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', renamed config file to '${renamedAppData.configName}'`,
      )
      expect(result.stdout).not.toContain(`DELETE ${originalAppData.configName}`)
      expect(result.stdout).not.toContain(
        `CREATE ${renamedAppData.configName}`,
      )

      // check that app project has correct --config setting after rename
      expect(
        readJson(`${renamedAppData.projectDir}/project.json`).targets.firebase
          .options.command,
      ).toContain(`--config=${renamedAppData.configName}`)

      // check rename was successful
      validateProjectConfig(renamedAppData)
      validateFunctionConfig(currentFunctionData, renamedAppData)
      validateFunctionConfig(currentFunctionData2, renamedAppData)

      // run another sync to check there should be no orphaned functions from an app rename
      const result2 = await syncGeneratorAsync()
      expect(result2.stderr).not.toContain(
        'is no longer linked to a Firebase app',
      )
      expect(result2.stdout).not.toContain('UPDATE')
    })

    it('should detect renamed firebase apps & functions', async () => {
      currentAppData = getProjectData('apps', uniq('firebaseSyncApp'))
      currentFunctionData = getProjectData('apps', uniq('firebaseSyncFunction'))
      renamedFunctionData = getProjectData('apps', uniq('firebaseSyncFunction'))
      renamedAppData = getProjectData('apps', uniq('firebaseSyncApp'))

      await appGeneratorAsync(currentAppData)
      await functionGeneratorAsync(
        currentFunctionData,
        `--app ${currentAppData.projectName}`,
      )

      // rename app & function
      await renameProjectAsync(currentAppData, renamedAppData)
      await renameProjectAsync(currentFunctionData, renamedFunctionData)
      const originalAppData = currentAppData
      const originalFunctionData = currentFunctionData
      currentAppData = null
      currentFunctionData = null

      const result = await syncGeneratorAsync()

      expectStrings(result.stdout, [
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:name tag`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated targets`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:dep tag in firebase function '${renamedFunctionData.projectName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated environment assets path in firebase function '${renamedFunctionData.projectName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated database rules in '${renamedAppData.configName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated firestore rules in '${renamedAppData.configName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated firestore indexes in '${renamedAppData.configName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated storage rules in '${renamedAppData.configName}'`,
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase deploy command in firebase function '${renamedFunctionData.projectName}'`,
        `CHANGE Firebase function '${originalFunctionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated firebase:name tag`,
        `CHANGE Firebase function '${originalFunctionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated deploy target to '--only=functions:${renamedFunctionData.projectName}'`,
        `CHANGE Firebase function '${originalFunctionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated codebase in '${renamedAppData.configName}'`,
        `UPDATE apps/${renamedAppData.projectName}/project.json`,
        `UPDATE apps/${renamedFunctionData.projectName}/project.json`,
      ])

      expectStrings(result.stderr, [
        `WARNING: Can't match hosting target with public dir '${originalAppData.projectDir}/public' in '${renamedAppData.configName}' to a project in this workspace. Is it configured correctly?`,
      ])

      // we should not rename config if it is called firebase.json
      expect(result.stdout).not.toContain(
        `CHANGE Firebase app '${originalAppData.projectName}' was renamed to '${renamedAppData.projectName}', renamed config file to '${renamedAppData.configName}'`,
      )
      expect(result.stdout).not.toContain(`DELETE ${originalAppData.configName}`)
      expect(result.stdout).not.toContain(
        `CREATE ${renamedAppData.configName}`,
      )

      // check that app project has correct --config setting after rename
      expect(
        readJson(`${renamedAppData.projectDir}/project.json`).targets.firebase
          .options.command,
      ).toContain(`--config=${renamedAppData.configName}`)
      // check that function project has correct --config setting after rename
      expect(
        readJson(`${renamedFunctionData.projectDir}/project.json`).targets
          .deploy.options.command,
      ).toContain(`--only functions:${renamedFunctionData.projectName}`)

      // check rename was successful
      validateProjectConfig(renamedAppData)
      validateFunctionConfig(renamedFunctionData, renamedAppData)
    })

    it('should rename configs for renamed firebase apps when multiple apps in workspace', async () => {
      expect(!exists('firebase.json'))

      // create first project that will have the primary firebase.json config
      currentAppData = getProjectData('apps', uniq('firebaseSyncApp'))
      currentFunctionData = getProjectData('apps', uniq('firebaseSyncFunction'))
      await appGeneratorAsync(currentAppData)

      expect(currentAppData.configName).toEqual('firebase.json')
      expect(
        readJson(`${currentAppData.projectDir}/project.json`).targets.firebase
          .options.command,
      ).toContain(`--config=firebase.json`)
      expect(exists('firebase.json'))

      // generate second app after first app is generated so that first config is detected
      currentAppData2 = getProjectData('apps', uniq('firebaseSyncApp'), {
        customConfig: true,
      })
      renamedAppData = getProjectData('apps', uniq('firebaseSyncApp'), {
        customConfig: true,
      })

      expect(currentAppData2.configName).not.toEqual('firebase.json')
      expect(renamedAppData.configName).not.toEqual('firebase.json')

      await appGeneratorAsync(currentAppData2)
      await functionGeneratorAsync(
        currentFunctionData,
        `--app ${currentAppData2.projectName}`,
      )

      expect(
        readJson(`${currentAppData2.projectDir}/project.json`).targets.firebase
          .options.command,
      ).not.toContain(`--config=firebase.json`)
      expect(
        readJson(`${currentAppData2.projectDir}/project.json`).targets.firebase
          .options.command,
      ).toContain(`--config=${currentAppData2.configName}`)

      await renameProjectAsync(currentAppData2, renamedAppData)
      const originalAppData2 = currentAppData2
      currentAppData2 = null

      const result = await syncGeneratorAsync()

      expectStrings(result.stdout, [
        `CHANGE Firebase app '${originalAppData2.projectName}' was renamed to '${renamedAppData.projectName}', renamed config file to '${renamedAppData.configName}'`,
        `CHANGE Firebase app '${originalAppData2.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:name tag`,
        `CHANGE Firebase app '${originalAppData2.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:dep tag in firebase function '${currentFunctionData.projectName}'`,
        `CHANGE Firebase app '${originalAppData2.projectName}' was renamed to '${renamedAppData.projectName}', updated database rules in '${renamedAppData.configName}'`,
        `CHANGE Firebase app '${originalAppData2.projectName}' was renamed to '${renamedAppData.projectName}', updated firestore rules in '${renamedAppData.configName}'`,
        `CHANGE Firebase app '${originalAppData2.projectName}' was renamed to '${renamedAppData.projectName}', updated firestore indexes in '${renamedAppData.configName}'`,
        `CHANGE Firebase app '${originalAppData2.projectName}' was renamed to '${renamedAppData.projectName}', updated storage rules in '${renamedAppData.configName}'`,
        `CHANGE Firebase app '${originalAppData2.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase deploy command in firebase function '${currentFunctionData.projectName}'`,
        `UPDATE apps/${renamedAppData.projectName}/project.json`,
        `UPDATE apps/${currentFunctionData.projectName}/project.json`,
        `DELETE ${originalAppData2.configName}`,
        `CREATE ${renamedAppData.configName}`,
      ])

      expectStrings(result.stderr, [
        `WARNING: Can't match hosting target with public dir '${originalAppData2.projectDir}/public' in '${renamedAppData.configName}' to a project in this workspace. Is it configured correctly?`,
      ])

      // check that app project has correct --config setting after rename
      expect(
        readJson(`${renamedAppData.projectDir}/project.json`).targets.firebase
          .options.command,
      ).toContain(`--config=${renamedAppData.configName}`)

      // run another sync to check there should be no orphaned functions from an app rename
      const result2 = await syncGeneratorAsync()
      expect(result2.stderr).not.toContain(
        'is no longer linked to a Firebase app',
      )
      expect(result2.stdout).not.toContain('UPDATE')
    })
  })
})
