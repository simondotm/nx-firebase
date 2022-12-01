import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing'

const JEST_TIMEOUT = 120000

describe('nx-firebase e2e', () => {
  const appName = 'functions'
  const libName = 'lib'
  const appGeneratorCommand = 'generate @simondotm/nx-firebase:app'
  const libGeneratorCommand = 'generate @nrwl/js:lib'
  const npmScope = '@proj'
  const pluginName = '@simondotm/nx-firebase'
  const pluginPath = 'dist/packages/nx-firebase'
  const compileComplete = 'Done compiling TypeScript files for project'
  const buildSuccess = 'Successfully ran target build for project'

  function expectedFiles(project: string, projectDir: string = '') {
    const projectPath = projectDir
      ? `apps/${projectDir}/${project}`
      : `apps/${project}`
    return [
      `${projectPath}/src/index.ts`,
      `${projectPath}/public/index.html`,
      `${projectPath}/package.json`,
      `${projectPath}/readme.md`,
      `${projectPath}/database.rules.json`,
      `${projectPath}/firestore.indexes.json`,
      `${projectPath}/firestore.rules`,
      `${projectPath}/storage.rules`,
      `firebase.json`,
      `firebase.${project}.json`,
      `.firebaserc`,
    ]
  }

  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependant on one another.
  beforeAll(() => {
    ensureNxProject(pluginName, pluginPath)
  })

  afterAll(() => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    runNxCommandAsync('reset')
  })

  it(
    'should create & build nx-firebase app',
    async () => {
      const project = uniq(appName)
      await runNxCommandAsync(`${appGeneratorCommand} ${project}`)

      // test generator output

      expect(() => checkFilesExist(...expectedFiles(project))).not.toThrow()

      // test build executor
      const result = await runNxCommandAsync(`build ${project}`)
      expect(result.stdout).toContain(compileComplete)
      expect(result.stdout).toContain(`${buildSuccess} ${project}`)
      expect(result.stdout).toContain('Updated firebase functions package.json')

      const distPackageFile = `dist/apps/${project}/package.json`
      expect(() =>
        checkFilesExist(
          distPackageFile,
          `dist/apps/${project}/readme.md`,
          `dist/apps/${project}/src/index.js`,
        ),
      ).not.toThrow()

      const distPackage = readJson(distPackageFile)
      const deps = distPackage['dependencies']
      expect(deps).toBeDefined()
    },
    JEST_TIMEOUT,
  )

  describe('--directory', () => {
    it(
      'should create src in the specified directory',
      async () => {
        const project = uniq(appName)
        const projectDir = 'subdir'
        await runNxCommandAsync(
          `${appGeneratorCommand} ${project} --directory ${projectDir}`,
        )
        expect(() =>
          checkFilesExist(...expectedFiles(project, projectDir)),
        ).not.toThrow()
      },
      JEST_TIMEOUT,
    )
  })

  describe('--tags', () => {
    it(
      'should add tags to the project',
      async () => {
        const projectName = uniq(appName)
        //ensureNxProject(pluginName, pluginPath)
        await runNxCommandAsync(
          `${appGeneratorCommand} ${projectName} --tags e2etag,e2ePackage`,
        )
        const project = readJson(`apps/${projectName}/project.json`)
        expect(project.tags).toEqual(['e2etag', 'e2ePackage'])
      },
      JEST_TIMEOUT,
    )
  })

  //--------------------------------------------------------------------------------------------------
  // Library e2e tests
  //--------------------------------------------------------------------------------------------------

  it(
    'should create buildable typescript library',
    async () => {
      const project = uniq(libName)
      await runNxCommandAsync(
        `${libGeneratorCommand} ${project} --buildable --importPath="${npmScope}/${project}"`,
      )

      // no need to test the js library generator, only that it ran ok
      expect(() =>
        checkFilesExist(`libs/${project}/package.json`),
      ).not.toThrow()

      const result = await runNxCommandAsync(`build ${project}`)
      expect(result.stdout).toContain(compileComplete)
      expect(result.stdout).toContain(`${buildSuccess} ${project}`)
    },
    JEST_TIMEOUT,
  )
})
