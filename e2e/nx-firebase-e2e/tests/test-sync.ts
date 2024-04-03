import { readJson, uniq, exists } from '@nx/plugin/testing'

import {
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
} from '../test-utils'

//--------------------------------------------------------------------------------------------------
// Test the nx-firebase sync generator
//--------------------------------------------------------------------------------------------------
export function testSync() {
  describe('nx-firebase sync', () => {
    it('should sync firebase workspace with no changes', async () => {
      const result = await syncGeneratorAsync()
      // testDebug(result.stdout)
      expect(result.stdout).not.toContain('CHANGE')
      expect(result.stdout).not.toContain('UPDATE')
      expect(result.stdout).not.toContain('CREATE')
      expect(result.stdout).not.toContain('DELETE')
    })

    describe('--project', () => {
      it('should set firebase app project using --project', async () => {
        // create firebase app without specifying firebase deploy --project
        const appData = getProjectData('apps', uniq('firebaseSyncApp'))
        await appGeneratorAsync(appData)

        expect(
          readJson(`${appData.projectDir}/project.json`).targets.firebase
            .options.command,
        ).not.toContain(`--project`)
        const result = await syncGeneratorAsync(
          `--app=${appData.projectName} --project=test`,
        )
        // testDebug(result.stdout)
        expectStrings(result.stdout, [
          `CHANGE setting firebase target --project for '${appData.projectName}' to '--project=test'`,
          `UPDATE apps/${appData.projectName}/project.json`,
        ])
        expect(
          readJson(`${appData.projectDir}/project.json`).targets.firebase
            .options.command,
        ).toContain(`--project=test`)
        // cleanup - app
        await cleanAppAsync(appData)
      })

      it('should update firebase app project using --project', async () => {
        // create firebase app specifying firebase deploy --project
        const appData = getProjectData('apps', uniq('firebaseSyncApp'))
        await appGeneratorAsync(appData, `--project=test`)

        expect(
          readJson(`${appData.projectDir}/project.json`).targets.firebase
            .options.command,
        ).toContain(`--project=test`)
        const result = await syncGeneratorAsync(
          `--app=${appData.projectName} --project=test2`,
        )
        // testDebug(result.stdout)
        expectStrings(result.stdout, [
          `CHANGE updating firebase target --project for '${appData.projectName}' to '--project=test2'`,
          `UPDATE apps/${appData.projectName}/project.json`,
        ])
        expect(
          readJson(`${appData.projectDir}/project.json`).targets.firebase
            .options.command,
        ).toContain(`--project=test2`)

        // cleanup - app
        await cleanAppAsync(appData)
      })
    })

    describe('deletions', () => {
      it('should detect deleted firebase functions', async () => {
        const appData = getProjectData('apps', uniq('firebaseSyncApp'))
        const functionData = getProjectData(
          'apps',
          uniq('firebaseSyncFunction'),
        )
        await appGeneratorAsync(appData)
        await functionGeneratorAsync(
          functionData,
          `--app ${appData.projectName}`,
        )

        await removeProjectAsync(functionData)

        const result = await syncGeneratorAsync()
        // testDebug(result.stdout)
        expectStrings(result.stdout, [
          `CHANGE Firebase function '${functionData.projectName}' was deleted, removing function codebase from '${appData.configName}'`,
          `UPDATE ${appData.configName}`,
        ])

        // cleanup - app only, already removed function
        await cleanAppAsync(appData)
      })

      it('should detect deleted firebase apps', async () => {
        const appData = getProjectData('apps', uniq('firebaseSyncApp'))
        const functionData = getProjectData(
          'apps',
          uniq('firebaseSyncFunction'),
        )
        await appGeneratorAsync(appData)
        await functionGeneratorAsync(
          functionData,
          `--app ${appData.projectName}`,
        )

        await removeProjectAsync(appData)

        const result = await syncGeneratorAsync()
        // testDebug(result.stdout)
        expectStrings(result.stdout, [`DELETE ${appData.configName}`])
        expectStrings(result.stderr, [
          `CHANGE Firebase app '${appData.projectName}' was deleted, firebase:dep tag for firebase function '${functionData.projectName}' is no longer linked to a Firebase app.`,
        ])

        // NOTE:
        // a deleted firebase app means the assets glob input dir in a function is no longer valid
        // this is ok though because Nx quietly fails when processing assets for an invalid input dir

        // cleanup - function only, already removed app
        await cleanFunctionAsync(functionData)
      })

      it('should warn when no firebase apps use firebase.json config', async () => {
        const appData = getProjectData('apps', uniq('firebaseSyncApp'))
        const appData2 = getProjectData('apps', uniq('firebaseSyncApp'), {
          customConfig: true,
        })
        await appGeneratorAsync(appData)
        await appGeneratorAsync(appData2)

        // delete the app that used firebase.json
        await removeProjectAsync(appData)

        const result = await syncGeneratorAsync()
        // testDebug(result.stdout)
        expectStrings(result.stderr, [
          `None of the Firebase apps in this workspace use 'firebase.json' as their config. Firebase CLI may not work as expected. This can be fixed by renaming the config for one of your firebase projects to 'firebase.json'.`,
        ])

        // cleanup - second app
        await cleanFunctionAsync(appData2)
      })
    })

    describe('renames', () => {
      it('should detect renamed firebase functions', async () => {
        const appData = getProjectData('apps', uniq('firebaseSyncApp'))
        const functionData = getProjectData(
          'apps',
          uniq('firebaseSyncFunction'),
        )
        const renamedFunctionData = getProjectData(
          'apps',
          uniq('firebaseSyncFunction'),
        )
        await appGeneratorAsync(appData)
        await functionGeneratorAsync(
          functionData,
          `--app ${appData.projectName}`,
        )

        expect(
          readJson(`${functionData.projectDir}/project.json`).targets.deploy
            .options.command,
        ).toContain(`--only functions:${functionData.projectName}`)

        await renameProjectAsync(functionData, renamedFunctionData)

        const result = await syncGeneratorAsync()
        // testDebug(result.stdout)

        expectStrings(result.stdout, [
          `CHANGE Firebase function '${functionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated firebase:name tag`,
          `CHANGE Firebase function '${functionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated codebase in '${appData.configName}'`,
          `CHANGE Firebase function '${functionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated deploy target to '--only=functions:${renamedFunctionData.projectName}'`,
          `UPDATE apps/${renamedFunctionData.projectName}/project.json`,
          `UPDATE ${appData.configName}`,
        ])

        expect(
          readJson(`${renamedFunctionData.projectDir}/project.json`).targets
            .deploy.options.command,
        ).toContain(`--only functions:${renamedFunctionData.projectName}`)

        validateFunctionConfig(renamedFunctionData, appData)

        // cleanup - function, then app
        await cleanFunctionAsync(renamedFunctionData)
        await cleanAppAsync(appData)
      })

      it('should detect renamed firebase apps', async () => {
        const appData = getProjectData('apps', uniq('firebaseSyncApp'))
        // we will attach two functions to the app for this test
        const functionData = getProjectData(
          'apps',
          uniq('firebaseSyncFunction'),
        )
        const functionData2 = getProjectData(
          'apps',
          uniq('firebaseSyncFunction'),
        )
        const renamedAppData = getProjectData('apps', uniq('firebaseSyncApp'))
        await appGeneratorAsync(appData)
        await functionGeneratorAsync(
          functionData,
          `--app ${appData.projectName}`,
        )
        await functionGeneratorAsync(
          functionData2,
          `--app ${appData.projectName}`,
        )

        await renameProjectAsync(appData, renamedAppData)

        const result = await syncGeneratorAsync()
        // testDebug(result.stdout)

        expectStrings(result.stdout, [
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:name tag`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated targets`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:dep tag in firebase function '${functionData.projectName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated environment assets path in firebase function '${functionData.projectName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:dep tag in firebase function '${functionData2.projectName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated environment assets path in firebase function '${functionData2.projectName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated database rules in '${renamedAppData.configName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firestore rules in '${renamedAppData.configName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firestore indexes in '${renamedAppData.configName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated storage rules in '${renamedAppData.configName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase deploy command in firebase function '${functionData.projectName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase deploy command in firebase function '${functionData2.projectName}'`,
          `UPDATE ${renamedAppData.configName}`,
          `UPDATE apps/${renamedAppData.projectName}/project.json`,
          `UPDATE apps/${functionData.projectName}/project.json`,
          `UPDATE apps/${functionData2.projectName}/project.json`,
        ])

        expectStrings(result.stderr, [
          `WARNING: Can't match hosting target with public dir '${appData.projectDir}/public' in '${renamedAppData.configName}' to a project in this workspace. Is it configured correctly?`,
        ])

        // we should not rename config if it is called firebase.json
        expect(result.stdout).not.toContain(
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', renamed config file to '${renamedAppData.configName}'`,
        )
        expect(result.stdout).not.toContain(`DELETE ${appData.configName}`)
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
        validateFunctionConfig(functionData, renamedAppData)
        validateFunctionConfig(functionData2, renamedAppData)

        // run another sync to check there should be no orphaned functions from an app rename
        const result2 = await syncGeneratorAsync()
        expect(result2.stderr).not.toContain(
          'is no longer linked to a Firebase app',
        )
        expect(result2.stdout).not.toContain('UPDATE')

        // cleanup - function, then app
        await cleanFunctionAsync(functionData)
        await cleanFunctionAsync(functionData2)
        await cleanAppAsync(renamedAppData)
      })

      it('should detect renamed firebase apps & functions', async () => {
        const appData = getProjectData('apps', uniq('firebaseSyncApp'))
        const functionData = getProjectData(
          'apps',
          uniq('firebaseSyncFunction'),
        )
        const renamedFunctionData = getProjectData(
          'apps',
          uniq('firebaseSyncFunction'),
        )
        const renamedAppData = getProjectData('apps', uniq('firebaseSyncApp'))

        await appGeneratorAsync(appData)
        await functionGeneratorAsync(
          functionData,
          `--app ${appData.projectName}`,
        )

        // rename app & function
        await renameProjectAsync(appData, renamedAppData)
        await renameProjectAsync(functionData, renamedFunctionData)

        const result = await syncGeneratorAsync()
        // testDebug(result.stdout)

        expectStrings(result.stdout, [
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:name tag`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated targets`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:dep tag in firebase function '${renamedFunctionData.projectName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated environment assets path in firebase function '${renamedFunctionData.projectName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated database rules in '${renamedAppData.configName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firestore rules in '${renamedAppData.configName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firestore indexes in '${renamedAppData.configName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated storage rules in '${renamedAppData.configName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase deploy command in firebase function '${renamedFunctionData.projectName}'`,
          `CHANGE Firebase function '${functionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated firebase:name tag`,
          `CHANGE Firebase function '${functionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated deploy target to '--only=functions:${renamedFunctionData.projectName}'`,
          `CHANGE Firebase function '${functionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated codebase in '${renamedAppData.configName}'`,
          `UPDATE apps/${renamedAppData.projectName}/project.json`,
          `UPDATE apps/${renamedFunctionData.projectName}/project.json`,
        ])

        expectStrings(result.stderr, [
          `WARNING: Can't match hosting target with public dir '${appData.projectDir}/public' in '${renamedAppData.configName}' to a project in this workspace. Is it configured correctly?`,
        ])

        // we should not rename config if it is called firebase.json
        expect(result.stdout).not.toContain(
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', renamed config file to '${renamedAppData.configName}'`,
        )
        expect(result.stdout).not.toContain(`DELETE ${appData.configName}`)
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

        // cleanup - function, then app
        await cleanFunctionAsync(renamedFunctionData)
        await cleanAppAsync(renamedAppData)
      })

      it('should rename configs for renamed firebase apps when multiple apps in workspace', async () => {
        expect(!exists('firebase.json'))

        // create first project that will have the primary firebase.json config
        const appDataPrimary = getProjectData('apps', uniq('firebaseSyncApp'))
        const functionData = getProjectData(
          'apps',
          uniq('firebaseSyncFunction'),
        )
        await appGeneratorAsync(appDataPrimary)

        expect(appDataPrimary.configName).toEqual('firebase.json')
        expect(
          readJson(`${appDataPrimary.projectDir}/project.json`).targets.firebase
            .options.command,
        ).toContain(`--config=firebase.json`)
        expect(exists('firebase.json'))

        // generate second app after first app is generated so that first config is detected
        const appData = getProjectData('apps', uniq('firebaseSyncApp'), {
          customConfig: true,
        })
        const renamedAppData = getProjectData('apps', uniq('firebaseSyncApp'), {
          customConfig: true,
        })

        expect(appData.configName).not.toEqual('firebase.json')
        expect(renamedAppData.configName).not.toEqual('firebase.json')

        await appGeneratorAsync(appData)
        await functionGeneratorAsync(
          functionData,
          `--app ${appData.projectName}`,
        )

        expect(
          readJson(`${appData.projectDir}/project.json`).targets.firebase
            .options.command,
        ).not.toContain(`--config=firebase.json`)
        expect(
          readJson(`${appData.projectDir}/project.json`).targets.firebase
            .options.command,
        ).toContain(`--config=${appData.configName}`)

        await renameProjectAsync(appData, renamedAppData)

        const result = await syncGeneratorAsync()
        // testDebug(result.stdout)

        expectStrings(result.stdout, [
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', renamed config file to '${renamedAppData.configName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:name tag`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:dep tag in firebase function '${functionData.projectName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated database rules in '${renamedAppData.configName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firestore rules in '${renamedAppData.configName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firestore indexes in '${renamedAppData.configName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated storage rules in '${renamedAppData.configName}'`,
          `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase deploy command in firebase function '${functionData.projectName}'`,
          `UPDATE apps/${renamedAppData.projectName}/project.json`,
          `UPDATE apps/${functionData.projectName}/project.json`,
          `DELETE ${appData.configName}`,
          `CREATE ${renamedAppData.configName}`,
        ])

        expectStrings(result.stderr, [
          `WARNING: Can't match hosting target with public dir '${appData.projectDir}/public' in '${renamedAppData.configName}' to a project in this workspace. Is it configured correctly?`,
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

        // cleanup - function, then app
        await cleanFunctionAsync(functionData)
        await cleanAppAsync(renamedAppData, {
          appsRemaining: 1,
          functionsRemaining: 0,
        })
        await cleanAppAsync(appDataPrimary)
      })
    })
  })
}
