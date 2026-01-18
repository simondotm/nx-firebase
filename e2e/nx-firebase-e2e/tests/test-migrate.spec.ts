import { readJson, uniq, updateFile, renameFile } from '@nx/plugin/testing'

import {
  ProjectData,
  appGeneratorAsync,
  cleanAppAsync,
  cleanFunctionAsync,
  functionGeneratorAsync,
  getProjectData,
  validateProjectConfig,
  validateFunctionConfig,
  migrateGeneratorAsync,
  expectStrings,
  expectNoStrings,
  testDebug,
} from '../test-utils'
import { ProjectConfiguration, joinPathFragments } from '@nx/devkit'

// Ensure daemon is disabled for all e2e tests
beforeAll(() => {
  process.env['CI'] = 'true'
  process.env['NX_DAEMON'] = 'false'
})

//--------------------------------------------------------------------------------------------------
// Test migrations
//--------------------------------------------------------------------------------------------------
describe('nx-firebase migrate', () => {
  // Track current test's projects for cleanup
  let currentAppData: ProjectData | null = null
  let currentFunctionData: ProjectData | null = null

  // Always run cleanup after each test, even on failure
  afterEach(async () => {
    // Clean up function first (it depends on app)
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

  it('should successfuly migrate for legacy app', async () => {
    currentAppData = getProjectData('apps', uniq('firebaseMigrateApp'))
    currentFunctionData = getProjectData('apps', uniq('firebaseMigrateFunction'))
    await appGeneratorAsync(currentAppData)
    await functionGeneratorAsync(
      currentFunctionData,
      `--app ${currentAppData.projectName}`,
    )

    const result = await migrateGeneratorAsync()
    expectStrings(result.stdout, [`Running plugin migrations for workspace`])

    // modify firebase app to be v2 schema
    const projectFile = `${currentAppData.projectDir}/project.json`
    const projectJson = readJson<ProjectConfiguration>(projectFile)
    projectJson.targets['serve'].executor = 'nx:run-commands'
    projectJson.targets[
      'getconfig'
    ].options.command = `nx run ${currentAppData.projectName}:firebase functions:config:get > ${currentAppData.projectDir}/.runtimeconfig.json`
    updateFile(projectFile, JSON.stringify(projectJson, null, 3))

    // remove environment folder from app
    // cant delete in e2e, so lets just rename environment dir for now
    renameFile(
      joinPathFragments(currentAppData.projectDir, 'environment'),
      joinPathFragments(currentAppData.projectDir, uniq('environment')),
    )

    // modify firebase.json to be v2 schema
    const configFile = `firebase.json`
    const configJson = readJson(configFile)
    delete configJson.functions[0].ignore
    updateFile(configFile, JSON.stringify(configJson, null, 3))

    // remove globs from function project
    const functionFile = `${currentFunctionData.projectDir}/project.json`
    const functionJson = readJson<ProjectConfiguration>(functionFile)
    const options = functionJson.targets['build'].options
    const assets = options.assets as string[]
    options.assets = [assets.shift()]
    updateFile(functionFile, JSON.stringify(functionJson, null, 3))

    // run migrate script
    const result2 = await migrateGeneratorAsync()
    expectStrings(result2.stdout, [
      `MIGRATE Added default environment file 'environment/.env' for firebase app '${currentAppData.projectName}'`,
      `MIGRATE Added default environment file 'environment/.env.local' for firebase app '${currentAppData.projectName}'`,
      `MIGRATE Added default environment file 'environment/.secret.local' for firebase app '${currentAppData.projectName}'`,
      `MIGRATE Updated getconfig target to use ignore environment directory for firebase app '${currentAppData.projectName}'`,
      `MIGRATE Updated serve target for firebase app '${currentAppData.projectName}'`,
      `MIGRATE Added assets glob for firebase function app '${currentFunctionData.projectName}'`,
      `UPDATE firebase.json`,
      `CREATE ${currentAppData.projectDir}/environment/.env`,
      `CREATE ${currentAppData.projectDir}/environment/.env.local`,
      `CREATE ${currentAppData.projectDir}/environment/.secret.local`,
      `UPDATE ${currentAppData.projectDir}/project.json`,
    ])

    validateProjectConfig(currentAppData)

    //todo: validateFunctionConfig - IMPORTANT since we missed some errors in last release due to this missing test
    // where assets glob was malformed
    validateFunctionConfig(currentFunctionData, currentAppData)

    // run it again
    const result3 = await migrateGeneratorAsync()
    expectStrings(result.stdout, [`Running plugin migrations for workspace`])
    expectNoStrings(result3.stdout, [
      `MIGRATE Added default environment file 'environment/.env' for firebase app '${currentAppData.projectName}'`,
      `MIGRATE Added default environment file 'environment/.env.local' for firebase app '${currentAppData.projectName}'`,
      `MIGRATE Added default environment file 'environment/.secret.local' for firebase app '${currentAppData.projectName}'`,
      `MIGRATE Updated getconfig target to use ignore environment directory for firebase app '${currentAppData.projectName}'`,
      `MIGRATE Updated serve target for firebase app '${currentAppData.projectName}'`,
      `MIGRATE Added assets glob for firebase function app '${currentFunctionData.projectName}'`,
      `UPDATE firebase.json`,
      `CREATE ${currentAppData.projectDir}/environment/.env`,
      `CREATE ${currentAppData.projectDir}/environment/.env.local`,
      `CREATE ${currentAppData.projectDir}/environment/.secret.local`,
      `UPDATE ${currentAppData.projectDir}/project.json`,
    ])
  })
})
