import {
  readJson,
  runNxCommandAsync,
  uniq,
  checkFilesExist,
} from '@nx/plugin/testing'

import {
  ProjectData,
  appGeneratorAsync,
  cleanAppAsync,
  getProjectData,
  validateProjectConfig,
} from '../test-utils'

function expectedAppFiles(projectData: ProjectData) {
  const projectPath = projectData.projectDir
  return [
    `${projectPath}/public/index.html`,
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
export function testApplication() {
  describe('nx-firebase application', () => {
    it('should create nx-firebase app', async () => {
      const appData = getProjectData('apps', uniq('firebaseSetupApp'))
      await appGeneratorAsync(appData)
      // test generator output
      expect(() => checkFilesExist(...expectedAppFiles(appData))).not.toThrow()

      validateProjectConfig(appData)

      // cleanup - app
      await cleanAppAsync(appData)
    })

    it('should build nx-firebase app', async () => {
      const appData = getProjectData('apps', uniq('firebaseSetupApp'))
      await appGeneratorAsync(appData)

      // test app builder
      // at this point there are no functions so it does nothing
      const result = await runNxCommandAsync(`build ${appData.projectName}`)
      expect(result.stdout).toContain('Build succeeded.')

      // cleanup - app
      await cleanAppAsync(appData)
    })

    describe('--directory', () => {
      it('should create nx-firebase app in the specified directory', async () => {
        const appData = getProjectData('apps', uniq('firebaseSetupApp'), {
          dir: 'subdir',
        })
        await appGeneratorAsync(appData)
        expect(() =>
          checkFilesExist(...expectedAppFiles(appData)),
        ).not.toThrow()

        const project = readJson(`${appData.projectDir}/project.json`)
        expect(project.name).toEqual(`${appData.projectName}`)

        validateProjectConfig(appData)

        // cleanup - app
        await cleanAppAsync(appData)
      })
    })

    describe('--tags', () => {
      it('should add tags to the project', async () => {
        const appData = getProjectData('apps', uniq('firebaseSetupApp'))
        await appGeneratorAsync(appData, `--tags e2etag,e2ePackage`)
        const project = readJson(`${appData.projectDir}/project.json`)
        expect(project.tags).toEqual([
          'firebase:app',
          `firebase:name:${appData.projectName}`,
          'e2etag',
          'e2ePackage',
        ])

        // cleanup - app
        await cleanAppAsync(appData)
      })
    })
  })
}
