import {
  readJson,
  runNxCommandAsync,
  uniq,
  checkFilesExist,
  readFile,
} from '@nx/plugin/testing'

import {
  ProjectData,
  appGeneratorAsync,
  cleanAppAsync,
  getProjectData,
  testDebug,
  validateProjectConfig,
} from '../test-utils'

// Ensure daemon is disabled for all e2e tests
beforeAll(() => {
  process.env['CI'] = 'true'
  process.env['NX_DAEMON'] = 'false'
})

function expectedAppFiles(projectData: ProjectData) {
  const projectPath = projectData.projectDir
  return [
    `${projectPath}/public/index.html`,
    `${projectPath}/public/404.html`,
    `${projectPath}/database.rules.json`,
    `${projectPath}/firestore.indexes.json`,
    `${projectPath}/firestore.rules`,
    `${projectPath}/project.json`,
    `${projectPath}/readme.md`,
    `${projectPath}/storage.rules`,
    `${projectData.configName}`,
    `.firebaserc`,
  ]
}

//--------------------------------------------------------------------------------------------------
// Application generator e2e tests
//--------------------------------------------------------------------------------------------------
describe('nx-firebase application', () => {
  // Track current test's app for cleanup
  let currentAppData: ProjectData | null = null

  // Always run cleanup after each test, even on failure
  afterEach(async () => {
    if (currentAppData) {
      try {
        await cleanAppAsync(currentAppData)
      } catch (e) {
        testDebug(`Cleanup warning: ${(e as Error).message}`)
      }
      currentAppData = null
    }
  })

  it('should create nx-firebase app', async () => {
    currentAppData = getProjectData('apps', uniq('firebaseSetupApp'))
    await appGeneratorAsync(currentAppData)

    // test generator output
    expect(() =>
      checkFilesExist(...expectedAppFiles(currentAppData!)),
    ).not.toThrow()

    validateProjectConfig(currentAppData)

    // check that the firestore.rules file has had the IN_30_DAYS placeholder replaced
    const firestoreRules = readFile(`${currentAppData.projectDir}/firestore.rules`)
    testDebug(firestoreRules)
    expect(firestoreRules).not.toContain('IN_30_DAYS')
  })

  it('should build nx-firebase app', async () => {
    currentAppData = getProjectData('apps', uniq('firebaseSetupApp'))
    await appGeneratorAsync(currentAppData)

    // test app builder
    // at this point there are no functions so it does nothing
    const result = await runNxCommandAsync(`build ${currentAppData.projectName}`)
    expect(result.stdout).toContain('Build succeeded.')
  })

  describe('--directory', () => {
    it('should create nx-firebase app in the specified directory', async () => {
      currentAppData = getProjectData('apps', uniq('firebaseSetupApp'), {
        dir: 'subdir',
      })
      await appGeneratorAsync(currentAppData)
      expect(() =>
        checkFilesExist(...expectedAppFiles(currentAppData!)),
      ).not.toThrow()

      const project = readJson(`${currentAppData.projectDir}/project.json`)
      expect(project.name).toEqual(`${currentAppData.projectName}`)

      validateProjectConfig(currentAppData)
    })
  })

  describe('--tags', () => {
    it('should add tags to the project', async () => {
      currentAppData = getProjectData('apps', uniq('firebaseSetupApp'))
      await appGeneratorAsync(currentAppData, `--tags e2etag,e2ePackage`)
      const project = readJson(`${currentAppData.projectDir}/project.json`)
      expect(project.tags).toEqual([
        'firebase:app',
        `firebase:name:${currentAppData.projectName}`,
        'e2etag',
        'e2ePackage',
      ])
    })
  })
})
