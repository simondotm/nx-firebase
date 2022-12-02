import {
  checkFilesExist,
  ensureNxProject,
  readFile,
  readJson,
  runNxCommandAsync,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing'

const JEST_TIMEOUT = 120000

describe('nx-firebase e2e', () => {
  const appName = 'functions'
  // const libName = 'lib'
  const buildableLibName = 'buildablelib' // uniq(libName)
  const nonBuildableLibName = 'nonbuildablelib' // uniq(libName)
  const incompatibleLibName = 'incompatiblelib' // uniq(libName)
  const subDir = 'subdir'

  const appGeneratorCommand = 'generate @simondotm/nx-firebase:app'
  const libGeneratorCommand = 'generate @nrwl/js:lib'
  const npmScope = '@proj'
  const pluginName = '@simondotm/nx-firebase'
  const pluginPath = 'dist/packages/nx-firebase'
  const compileComplete = 'Done compiling TypeScript files for project'
  const buildSuccess = 'Successfully ran target build for project'

  const distDir = `dist/apps/${appName}`
  const buildableLibDir = `${distDir}/libs/${buildableLibName}`

  const indexTs = `apps/${appName}/src/index.ts`
  const indexTsFile = readFile(indexTs)
  const importMatch = `import * as functions from 'firebase-functions';`

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

  /**
   * Replace content in the application `index.ts` that matches `importMatch` with `importAddition`
   * @param match - string to match in the index.ts
   * @param addition - string to add after the matched line in the index.ts
   */
  function addContentToIndexTs(match: string, addition: string) {
    updateFile(indexTs, (content: string) => {
      const replaced = content.replace(importMatch, `${match}\n${addition}`)
      return replaced
    })
  }

  /**
   * Restore the application index.ts to initial state
   */
  function resetIndexTs() {
    updateFile(indexTs, indexTsFile)
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
    'should create workspace without firebase dependencies',
    async () => {
      // test that generator adds dependencies to workspace package.json
      // should not be initially set
      const packageJson = readJson(`package.json`)
      expect(packageJson.dependencies['firebase']).toBeUndefined()
      expect(packageJson.dependencies['firebase-admin']).toBeUndefined()
      expect(packageJson.dependencies['firebase-functions']).toBeUndefined()
      expect(
        packageJson.devDependencies['firebase-functions-test'],
      ).toBeUndefined()
      expect(packageJson.devDependencies['firebase-tools']).toBeUndefined()
    },
    JEST_TIMEOUT,
  )

  it(
    'should create nx-firebase app',
    async () => {
      const project = appName //uniq(appName)
      await runNxCommandAsync(`${appGeneratorCommand} ${project}`)
      // test generator output
      expect(() => checkFilesExist(...expectedFiles(project))).not.toThrow()
    },
    JEST_TIMEOUT,
  )

  it(
    'should run nx-firebase init',
    async () => {
      // test that generator adds dependencies to workspace package.json
      const packageJson = readJson(`package.json`)
      expect(packageJson.dependencies['firebase']).toBeDefined()
      expect(packageJson.dependencies['firebase-admin']).toBeDefined()
      expect(packageJson.dependencies['firebase-functions']).toBeDefined()
      expect(
        packageJson.devDependencies['firebase-functions-test'],
      ).toBeDefined()
      expect(packageJson.devDependencies['firebase-tools']).toBeDefined()
    },
    JEST_TIMEOUT,
  )

  it(
    'should build nx-firebase app',
    async () => {
      const project = appName
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
    },
    JEST_TIMEOUT,
  )

  it(
    'should add firebase dependencies to output nx-firebase app',
    async () => {
      const project = appName
      const distPackageFile = `dist/apps/${project}/package.json`
      const distPackage = readJson(distPackageFile)
      const deps = distPackage['dependencies']
      expect(deps).toBeDefined()
    },
    JEST_TIMEOUT,
  )

  describe('--directory', () => {
    it(
      'should create & build nx-firebase app in the specified directory',
      async () => {
        const projectName = uniq(appName)
        const projectDir = subDir
        await runNxCommandAsync(
          `${appGeneratorCommand} ${projectName} --directory ${projectDir}`,
        )
        expect(() =>
          checkFilesExist(...expectedFiles(projectName, projectDir)),
        ).not.toThrow()

        const project = readJson(
          `apps/${projectDir}/${projectName}/project.json`,
        )
        expect(project.name).toEqual(`${projectDir}-${projectName}`)
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
  // Create Libraries for e2e tests
  //--------------------------------------------------------------------------------------------------
  describe('libraries', () => {
    it(
      'should create buildable typescript library',
      async () => {
        const project = buildableLibName
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

    it(
      'should create non-buildable typescript library',
      async () => {
        const projectName = nonBuildableLibName
        await runNxCommandAsync(
          `${libGeneratorCommand} ${projectName} --buildable=false --importPath="${npmScope}/${projectName}"`,
        )

        expect(() =>
          checkFilesExist(`libs/${projectName}/package.json`),
        ).toThrow()

        const project = readJson(`libs/${projectName}/project.json`)
        expect(project.targets.build).not.toBeDefined()
      },
      JEST_TIMEOUT,
    )

    it(
      'should create incompatible typescript library',
      async () => {
        const project = incompatibleLibName
        await runNxCommandAsync(
          `${libGeneratorCommand} ${project} --directory=${subDir}`,
        )

        expect(() =>
          checkFilesExist(`libs/${subDir}/${project}/package.json`),
        ).not.toThrow()

        const result = await runNxCommandAsync(`build ${subDir}-${project}`)
        expect(result.stdout).toContain(compileComplete)
        expect(result.stdout).toContain(`${buildSuccess} ${subDir}-${project}`)
      },
      JEST_TIMEOUT,
    )
  })

  //--------------------------------------------------------------------------------------------------
  // Test import & dependency handling
  //--------------------------------------------------------------------------------------------------

  describe('nx-firebase dependencies', () => {
    // add our new nodelib as an imported dependency
    it(
      'should add buildable library as an index.ts dependency',
      async () => {
        const importAddition = `import { ${buildableLibName} } from '@proj/${buildableLibName}'\nconsole.log(${buildableLibName}())\n`
        expect(indexTsFile).toContain(importMatch)
        addContentToIndexTs(importMatch, importAddition)
        expect(readFile(indexTs)).toContain(importAddition)
      },
      JEST_TIMEOUT,
    )

    // rebuild app with deps
    it(
      'should build nx-firebase:app with buildable library dependency',
      async () => {
        const result = await runNxCommandAsync(`build ${appName}`)
        expect(result.stdout).toContain('Done compiling TypeScript files')
        expect(result.stdout).toContain(
          `Added 'npm' dependency 'firebase-admin'`,
        )
        expect(result.stdout).toContain(
          `Added 'npm' dependency 'firebase-functions'`,
        )
        expect(result.stdout).toContain(
          `Copied 'lib' dependency '@proj/buildablelib'`,
        )
        expect(result.stdout).toContain(
          `Updated firebase functions package.json`,
        )
      },
      JEST_TIMEOUT,
    )

    // rebuild app with deps
    it(
      'should copy dependent buildable libraries',
      async () => {
        const result = await runNxCommandAsync(`build ${appName}`)
        expect(result.stdout).toContain('Done compiling TypeScript files')

        expect(() =>
          checkFilesExist(
            `${buildableLibDir}/package.json`,
            `${buildableLibDir}/README.md`,
            `${buildableLibDir}/src/index.js`,
            `${buildableLibDir}/src/index.d.ts`,
            `${buildableLibDir}/src/lib/buildablelib.js`,
            `${buildableLibDir}/src/lib/buildablelib.d.ts`,
          ),
        ).not.toThrow()

        const distPackageFile = `${distDir}/package.json`
        const distPackage = readJson(distPackageFile)
        const deps = distPackage['dependencies']
        expect(deps).toBeDefined()

        expect(deps['@proj/buildablelib']).toEqual(
          `file:libs/${buildableLibName}`,
        )
        expect(deps['firebase-admin']).toBeDefined()
        expect(deps['firebase-functions']).toBeDefined()
      },
      JEST_TIMEOUT,
    )
  })
})
