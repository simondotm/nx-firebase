import { readJsonFile, writeJsonFile } from '@nrwl/devkit'
import {
  checkFilesExist,
  ensureNxProject,
  readFile,
  readJson,
  runNxCommandAsync,
  tmpProjPath,
  uniq,
  updateFile,
} from '@nrwl/nx-plugin/testing'

const JEST_TIMEOUT = 120000

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

const subDirBuildableLibName = `${subDir}-${buildableLibName}`
const subDirBuildableLibDir = `libs/${subDir}/${buildableLibName}`
const subDirBuildableLibDistDir = `${distDir}/${subDirBuildableLibDir}`
const subDirBuildableLibScope = `${npmScope}/${subDirBuildableLibName}`
const subDirBuildableLibFunction = `${subDir}${
  buildableLibName[0].toUpperCase() + buildableLibName.substring(1)
}`
const subDirBuildableLibFunctionsDistDir = `${distDir}/libs/${subDirBuildableLibName}`
const buildableLibFunctionsDistDir = `${distDir}/libs/${buildableLibName}`

const indexTs = `apps/${appName}/src/index.ts`
let indexTsFile
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

describe('nx-firebase e2e', () => {
  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependant on one another.
  beforeAll(async () => {
    ensureNxProject(pluginName, pluginPath)

    const nxJsonFile = tmpProjPath('nx.json')
    const nxJson = readJsonFile(nxJsonFile)
    nxJson['pluginsConfig'] = {
      '@nrwl/js': {
        analyzeSourceFiles: true,
      },
    }
    // force local e2e tests to use same setup as CI environment
    nxJson.tasksRunnerOptions.default.options.useDaemonProcess = false
    writeJsonFile(nxJsonFile, nxJson)
    await runNxCommandAsync('reset')
  }, JEST_TIMEOUT)

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
      // stash a copy of the default index.ts
      indexTsFile = readFile(indexTs)
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
      'should create buildable typescript library in subdir',
      async () => {
        const project = buildableLibName
        await runNxCommandAsync(
          `${libGeneratorCommand} ${project} --buildable --directory ${subDir} --importPath="${npmScope}/subdir-${project}"`,
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
    /*
    // add non-buildable lib as an imported dependency & check error handling
    it(
      'should report non-buildable library imports as unsupported',
      async () => {
        const libName = nonBuildableLibName
        const importAddition = `import { ${libName} } from '@proj/${libName}'\nconsole.log(${libName}())\n`
        expect(indexTsFile).toContain(importMatch)
        addContentToIndexTs(importMatch, importAddition)
        expect(readFile(indexTs)).toContain(importAddition)
        const result = await runNxCommandAsync(`build ${appName} --verbose`, {
          silenceError: true,
        })
        expect(result.stdout).not.toContain(compileComplete)
        // We cant check output for this test scenario since
        // importing a non buildable library will fail tsc with not in rootDir errors before the firebase plugin can report these issues
        // expect(result.stdout).toContain(
        //   `ERROR: Found non-buildable library dependency '@proj/${buildableLibName}'`,
        // )
      },
      JEST_TIMEOUT,
    )

    it(
      'should report incompatible library imports as unsupported',
      async () => {
        resetIndexTs()
        const libName = incompatibleLibName
        const libFuncName = 'subdirIncompatiblelib'
        const importAddition = `import { subdirIncompatiblelib } from '@proj/${subDir}/${libName}'\nconsole.log(subdirIncompatiblelib())\n`
        expect(indexTsFile).toContain(importMatch)
        addContentToIndexTs(importMatch, importAddition)
        expect(readFile(indexTs)).toContain(importAddition)
        const result = await runNxCommandAsync(`build ${appName} --verbose`, {
          silenceError: true,
        })
        expect(result.stdout).toContain(compileComplete)
        expect(result.stderr).toContain(
          'ERROR: Found incompatible nested library dependency',
        )
      },
      JEST_TIMEOUT,
    )

    // check buildable lib from subdir
    it(
      'should support buildable subdir library as a dependency',
      async () => {
        resetIndexTs()
        // add dependency
        const importAddition = `import { ${subDirBuildableLibFunction} } from '${subDirBuildableLibScope}'\nconsole.log(${subDirBuildableLibFunction}())\n`
        expect(readFile(indexTs)).toContain(importMatch)
        expect(readFile(indexTs)).toMatch(indexTsFile)
        addContentToIndexTs(importMatch, importAddition)
        expect(readFile(indexTs)).toContain(importAddition)

        // build project
        const result = await runNxCommandAsync(`build ${appName} --verbose`)
        expect(result.stdout).toContain('Done compiling TypeScript files')

        // check console output
        expect(result.stdout).toContain(
          `Added 'npm' dependency 'firebase-admin'`,
        )
        expect(result.stdout).toContain(
          `Added 'npm' dependency 'firebase-functions'`,
        )
        expect(result.stdout).toContain(
          `Copied 'lib' dependency '@proj/subdir-buildablelib'`,
        )
        expect(result.stdout).toContain(
          `Updated firebase functions package.json`,
        )

        // check dist outputs - expect copies of the dependent library
        expect(() =>
          checkFilesExist(
            `${subDirBuildableLibFunctionsDistDir}/package.json`,
            `${subDirBuildableLibFunctionsDistDir}/README.md`,
            `${subDirBuildableLibFunctionsDistDir}/src/index.js`,
            `${subDirBuildableLibFunctionsDistDir}/src/index.d.ts`,
            `${subDirBuildableLibFunctionsDistDir}/src/lib/${subDirBuildableLibName}.js`,
            `${subDirBuildableLibFunctionsDistDir}/src/lib/${subDirBuildableLibName}.d.ts`,
          ),
        ).not.toThrow()

        // check dist package
        const distPackageFile = `${distDir}/package.json`
        const distPackage = readJson(distPackageFile)
        const deps = distPackage['dependencies']
        expect(deps).toBeDefined()

        expect(deps[subDirBuildableLibScope]).toEqual(
          `file:libs/${subDirBuildableLibName}`,
        )
        expect(deps['firebase-admin']).toBeDefined()
        expect(deps['firebase-functions']).toBeDefined()
      },
      JEST_TIMEOUT,
    )
*/
    // check buildable lib as an imported dependency
    it(
      'should support buildable library as a dependency',
      async () => {
        // add dependency
        // resetIndexTs()
        // build project
        const result1 = await runNxCommandAsync(`build ${appName}`)
        expect(result1.stdout).toContain('Done compiling TypeScript files')

        const importAddition = `import { ${buildableLibName} } from '@proj/${buildableLibName}'\nconsole.log(${buildableLibName}())\n`
        expect(readFile(indexTs)).toContain(importMatch)
        expect(readFile(indexTs)).toMatch(indexTsFile)
        addContentToIndexTs(importMatch, importAddition)

        await new Promise((r) => setTimeout(r, 5000))
        expect(readFile(indexTs)).toContain(importAddition)

        // build project
        const result = await runNxCommandAsync(`build ${appName}`)
        expect(result.stdout).toContain('Done compiling TypeScript files')

        // check console output
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

        // check dist outputs
        expect(() =>
          checkFilesExist(
            `${buildableLibFunctionsDistDir}/package.json`,
            `${buildableLibFunctionsDistDir}/README.md`,
            `${buildableLibFunctionsDistDir}/src/index.js`,
            `${buildableLibFunctionsDistDir}/src/index.d.ts`,
            `${buildableLibFunctionsDistDir}/src/lib/buildablelib.js`,
            `${buildableLibFunctionsDistDir}/src/lib/buildablelib.d.ts`,
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
