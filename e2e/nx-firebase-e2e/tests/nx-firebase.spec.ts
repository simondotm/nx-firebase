import {
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
  updateFile,
  renameFile,
  checkFilesExist,
  exists,
  readFile,
} from '@nx/plugin/testing'

import {
  ProjectData,
  appGeneratorAsync,
  cleanAppAsync,
  cleanFunctionAsync,
  testDebug,
  expectStrings,
  functionGeneratorAsync,
  getProjectData,
  syncGeneratorAsync,
  safeRunNxCommandAsync,
  validateProjectConfig,
  validateFunctionConfig,
  expectNoStrings,
  libGeneratorAsync,
  runTargetAsync,
  getMainTs,
  getLibImport,
  addImport,
  removeProjectAsync,
  renameProjectAsync,
  migrateGeneratorAsync,
} from '../test-utils'
import { ProjectConfiguration, joinPathFragments } from '@nx/devkit'

const JEST_TIMEOUT = 190000
jest.setTimeout(JEST_TIMEOUT)

// NOTE: If one e2e test fails, cleanup fails, so all subsequent tests will fail.

// DONE
// not gonna test watch, serve, emulate, killports, getconfig
// check that deploy runs the application deploy
// check that lint works for functions & apps
// check that test works for functions & apps
// check that serve works for apps
// remove all tests related to old plugin
// dont check anything that the generator tests already test, this is just e2e
// check all options
// check dependent packages are installed
// check that functions are added
// check that functions build
// check all build artefacts are correct
// check that libraries can be buildable and non-buildable
// check that build includes building of dependent functions

const pluginName = '@simondotm/nx-firebase'
const pluginPath = 'dist/packages/nx-firebase'
const compileComplete = 'Done compiling TypeScript files for project'
const buildSuccess = 'Successfully ran target build for project'

// libraries persist across all e2e tests
const buildableLibData = getProjectData('libs', 'buildablelib')
const nonbuildableLibData = getProjectData('libs', 'nonbuildablelib')
const subDirBuildableLibData = getProjectData('libs', 'buildablelib', {
  dir: 'subdir',
})
const subDirNonbuildableLibData = getProjectData('libs', 'nonbuildablelib', {
  dir: 'subdir',
})

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

function expectedFunctionFiles(projectData: ProjectData) {
  const projectPath = projectData.projectDir
  return [
    `${projectPath}/src/main.ts`,
    `${projectPath}/.eslintrc.json`,
    `${projectPath}/jest.config.ts`,
    `${projectPath}/package.json`,
    `${projectPath}/project.json`,
    `${projectPath}/readme.md`,
    `${projectPath}/tsconfig.app.json`,
    `${projectPath}/tsconfig.json`,
    `${projectPath}/tsconfig.spec.json`,
  ]
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
  }, JEST_TIMEOUT)

  afterAll(() => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    runNxCommandAsync('reset')
  })

  describe('workspace setup', () => {
    it('should create workspace without firebase dependencies', async () => {
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
    })

    it('should create workspace without nx dependencies', async () => {
      // test that generator adds dependencies to workspace package.json
      // should not be initially set
      const packageJson = readJson(`package.json`)
      expect(packageJson.devDependencies['@nx/node']).toBeUndefined()
      expect(packageJson.devDependencies['@nx/esbuild']).toBeUndefined()
      expect(packageJson.devDependencies['@nx/eslint']).toBeUndefined()
      expect(packageJson.devDependencies['@nx/js']).toBeUndefined()
      expect(packageJson.devDependencies['@nx/jest']).toBeUndefined()
    })

    it('should run nx-firebase init', async () => {
      await safeRunNxCommandAsync(`generate @simondotm/nx-firebase:init`)
      // test that generator adds dependencies to workspace package.json
      const packageJson = readJson(`package.json`)
      expect(packageJson.dependencies['firebase']).toBeDefined()
      expect(packageJson.dependencies['firebase-admin']).toBeDefined()
      expect(packageJson.dependencies['firebase-functions']).toBeDefined()
      expect(
        packageJson.devDependencies['firebase-functions-test'],
      ).toBeDefined()
      expect(packageJson.devDependencies['firebase-tools']).toBeDefined()
      expect(packageJson.devDependencies['@nx/node']).toBeDefined()
      expect(packageJson.devDependencies['@nx/esbuild']).toBeDefined()
      expect(packageJson.devDependencies['@nx/eslint']).toBeDefined()
      expect(packageJson.devDependencies['@nx/js']).toBeDefined()
      expect(packageJson.devDependencies['@nx/jest']).toBeDefined()
    })
  })

  //--------------------------------------------------------------------------------------------------
  // Create Libraries for e2e function generator tests
  //--------------------------------------------------------------------------------------------------
  describe('setup libraries', () => {
    it('should create buildable typescript library', async () => {
      await libGeneratorAsync(
        buildableLibData,
        `--buildable --importPath="${buildableLibData.npmScope}"`,
      )

      // no need to test the js library generator, only that it ran ok
      expect(() =>
        checkFilesExist(`${buildableLibData.projectDir}/package.json`),
      ).not.toThrow()

      const result = await runNxCommandAsync(
        `build ${buildableLibData.projectName}`,
      )
      expect(result.stdout).toContain(compileComplete)
      expect(result.stdout).toContain(
        `${buildSuccess} ${buildableLibData.projectName}`,
      )
    })

    it('should create buildable typescript library in subdir', async () => {
      await libGeneratorAsync(
        subDirBuildableLibData,
        `--directory=${subDirBuildableLibData.dir} --buildable --importPath="${subDirBuildableLibData.npmScope}"`,
      )

      // no need to test the js library generator, only that it ran ok
      expect(() =>
        checkFilesExist(`${subDirBuildableLibData.projectDir}/package.json`),
      ).not.toThrow()

      const result = await runNxCommandAsync(
        `build ${subDirBuildableLibData.projectName}`,
      )
      expect(result.stdout).toContain(compileComplete)
      expect(result.stdout).toContain(
        `${buildSuccess} ${subDirBuildableLibData.projectName}`,
      )
    })

    it('should create non-buildable typescript library', async () => {
      await libGeneratorAsync(
        nonbuildableLibData,
        `--buildable=false --importPath="${nonbuildableLibData.npmScope}"`,
      )

      expect(() =>
        checkFilesExist(`${nonbuildableLibData.projectDir}/package.json`),
      ).toThrow()

      const project = readJson(`${nonbuildableLibData.projectDir}/project.json`)
      expect(project.targets.build).not.toBeDefined()
    })

    it('should create non-buildable typescript library in subdir', async () => {
      // const projectData = getProjectData('libs', 'nonbuildablelib', { dir: 'subdir' })
      await libGeneratorAsync(
        subDirNonbuildableLibData,
        `--directory=${subDirNonbuildableLibData.dir} --buildable=false --importPath="${subDirNonbuildableLibData.npmScope}"`,
      )

      expect(() =>
        checkFilesExist(`${subDirNonbuildableLibData.projectDir}/package.json`),
      ).toThrow()

      const project = readJson(
        `${subDirNonbuildableLibData.projectDir}/project.json`,
      )
      expect(project.targets.build).not.toBeDefined()
    })
  })

  //--------------------------------------------------------------------------------------------------
  // Application generator e2e tests
  //--------------------------------------------------------------------------------------------------

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
      // at this point there are no functions so it doe nothing
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
        await appGeneratorAsync(appData, `--directory ${appData.dir}`)
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

  //--------------------------------------------------------------------------------------------------
  // Function generator e2e tests
  //--------------------------------------------------------------------------------------------------

  describe('nx-firebase function', () => {
    it('should not create nx-firebase function without --app', async () => {
      const functionData = getProjectData('apps', uniq('firebaseFunction'))
      const result = await functionGeneratorAsync(functionData)
      expect(result.stdout).toContain("Required property 'app' is missing")
      // no cleanup required
    })

    it('should not create nx-firebase function with an invalid --app', async () => {
      const functionData = getProjectData('apps', uniq('firebaseFunction'))
      const result = await functionGeneratorAsync(
        functionData,
        '--app badapple',
      )
      expect(result.stdout).toContain(
        "A firebase application project called 'badapple' was not found in this workspace.",
      )
      // no cleanup required
    })

    it('should create nx-firebase function', async () => {
      const appData = getProjectData('apps', uniq('firebaseApp'))
      const functionData = getProjectData('apps', uniq('firebaseFunction'))
      await appGeneratorAsync(appData)
      await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)
      // test generator output
      expect(() =>
        checkFilesExist(...expectedFunctionFiles(functionData)),
      ).not.toThrow()

      // check dist files dont exist and we havent accidentally run this test out of sequence
      expect(() =>
        checkFilesExist(
          `dist/${functionData.projectDir}/main.js`,
          `dist/${functionData.projectDir}/package.json`,
          `dist/${functionData.projectDir}/.env`,
          `dist/${functionData.projectDir}/.env.local`,
          `dist/${functionData.projectDir}/.secret.local`,
        ),
      ).toThrow()

      validateFunctionConfig(functionData, appData)

      // cleanup
      await cleanFunctionAsync(functionData)
      await cleanAppAsync(appData)
    })

    it('should build nx-firebase function from the app', async () => {
      const appData = getProjectData('apps', uniq('firebaseApp'))
      const functionData = getProjectData('apps', uniq('firebaseFunction'))
      await appGeneratorAsync(appData)
      await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)

      validateFunctionConfig(functionData, appData)

      const result = await runTargetAsync(appData, 'build')
      expect(result.stdout).toContain('Build succeeded.')

      expect(() =>
        checkFilesExist(
          `dist/${functionData.projectDir}/main.js`,
          `dist/${functionData.projectDir}/package.json`,
          `dist/${functionData.projectDir}/.env`,
          `dist/${functionData.projectDir}/.env.local`,
          `dist/${functionData.projectDir}/.secret.local`,
        ),
      ).not.toThrow()

      // cleanup
      await cleanFunctionAsync(functionData)
      await cleanAppAsync(appData)
    })

    it('should build nx-firebase function directly', async () => {
      const appData = getProjectData('apps', uniq('firebaseApp'))
      const functionData = getProjectData('apps', uniq('firebaseFunction'))
      await appGeneratorAsync(appData)
      await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)

      validateFunctionConfig(functionData, appData)

      const result = await runTargetAsync(functionData, 'build')
      expect(result.stdout).toContain(
        `nx run ${functionData.projectName}:build`,
      )
      // esbuild outputs to stderr for some reason
      expect(result.stderr).toContain(`${functionData.distDir}/main.js`)
      // make sure it hasnt bundled node_modules, indicator is that bundle size is megabytes in size
      expect(result.stderr).not.toContain(`Mb`)

      // cleanup
      await cleanFunctionAsync(functionData)
      await cleanAppAsync(appData)
    })

    it('should add correct dependencies to the built function package.json', async () => {
      const appData = getProjectData('apps', uniq('firebaseApp'))
      const functionData = getProjectData('apps', uniq('firebaseFunction'))
      await appGeneratorAsync(appData)
      await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)

      validateFunctionConfig(functionData, appData)

      const result = await runTargetAsync(functionData, 'build')
      expect(result.stdout).toContain(
        `Successfully ran target build for project ${functionData.projectName}`,
      )

      expectStrings(result.stderr, [`${functionData.distDir}/main.js`])
      // make sure output build is not megabytes in size, which would mean we've
      // bundled node_modules as well
      expect(result.stdout).not.toContain('Mb')

      const distPackageFile = `${functionData.distDir}/package.json`
      expect(exists(distPackageFile))

      const distPackage = readJson(distPackageFile)
      const deps = distPackage['dependencies']
      expect(deps).toBeDefined()
      // firebase-admin is No longer in the default main.ts template
      // expect(deps['firebase-admin']).toBeDefined()
      expect(deps['firebase-functions']).toBeDefined()

      // cleanup
      await cleanFunctionAsync(functionData)
      await cleanAppAsync(appData)
    })

    it('should add tags to the function project', async () => {
      const appData = getProjectData('apps', uniq('firebaseApp'))
      const functionData = getProjectData('apps', uniq('firebaseFunction'))
      await appGeneratorAsync(appData)
      await functionGeneratorAsync(
        functionData,
        `--app ${appData.projectName}  --tags e2etag,e2ePackage`,
      )

      validateFunctionConfig(functionData, appData)

      const project = readJson(`${functionData.projectDir}/project.json`)
      expect(project.tags).toEqual([
        'firebase:function',
        `firebase:name:${functionData.projectName}`,
        `firebase:dep:${appData.projectName}`,
        'e2etag',
        'e2ePackage',
      ])

      // cleanup
      await cleanFunctionAsync(functionData)
      await cleanAppAsync(appData)
    })
  })

  //--------------------------------------------------------------------------------------------------
  // Test import & dependency handling
  //--------------------------------------------------------------------------------------------------

  describe('nx-firebase bundle dependencies', () => {
    it('should inline library dependencies into function bundle', async () => {
      // use libs we generated earler

      const appData = getProjectData('apps', uniq('firebaseDepsApp'))
      const functionData = getProjectData('apps', uniq('firebaseDepsFunction'))
      await appGeneratorAsync(appData)
      await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)

      validateFunctionConfig(functionData, appData)

      // add buildable & nonbuildable lib dependencies using import statements
      let mainTs = getMainTs()

      // import from a buildable lib
      const libImport1 = getLibImport(buildableLibData)
      const importAddition1 = `import { ${libImport1} } from '${buildableLibData.npmScope}'\nconsole.log(${libImport1}())\n`
      mainTs = addImport(mainTs, importAddition1)

      // import from a non buildable lib
      const libImport2 = getLibImport(nonbuildableLibData)
      const importAddition2 = `import { ${libImport2} } from '${nonbuildableLibData.npmScope}'\nconsole.log(${libImport2}())\n`
      mainTs = addImport(mainTs, importAddition2)

      // import from a buildable subdir lib
      const libImport3 = getLibImport(subDirBuildableLibData)
      const importAddition3 = `import { ${libImport3} } from '${subDirBuildableLibData.npmScope}'\nconsole.log(${libImport3}())\n`
      mainTs = addImport(mainTs, importAddition3)

      // import from a non buildable subdir lib
      const libImport4 = getLibImport(subDirNonbuildableLibData)
      const importAddition4 = `import { ${libImport4} } from '${subDirNonbuildableLibData.npmScope}'\nconsole.log(${libImport4}())\n`
      mainTs = addImport(mainTs, importAddition4)

      // write the new main.ts
      updateFile(functionData.mainTsPath, (content: string) => {
        return mainTs
      })

      // confirm the file changes
      const updatedMainTs = readFile(functionData.mainTsPath)
      expect(updatedMainTs).toContain(importAddition1)
      expect(updatedMainTs).toContain(importAddition2)
      expect(updatedMainTs).toContain(importAddition3)
      expect(updatedMainTs).toContain(importAddition4)

      // build
      const result = await runTargetAsync(functionData, `build`)
      // check console output
      expectStrings(result.stdout, [
        `Running target build for project ${functionData.projectName}`,
        `nx run ${buildableLibData.projectName}:build`,
        `nx run ${subDirBuildableLibData.projectName}:build`,
        `Compiling TypeScript files for project "${subDirBuildableLibData.projectName}"`,
        `Compiling TypeScript files for project "${buildableLibData.projectName}"`,
        `Done compiling TypeScript files for project "${buildableLibData.projectName}"`,
        `Done compiling TypeScript files for project "${subDirBuildableLibData.projectName}"`,
        `nx run ${functionData.projectName}:build`,
        `Successfully ran target build for project ${functionData.projectName}`,
      ])
      expectStrings(result.stderr, [`${functionData.distDir}/main.js`])
      // make sure output build is not megabytes in size, which would mean we've
      // bundled node_modules as well
      expect(result.stdout).not.toContain('Mb')

      // check dist outputs
      expect(() =>
        checkFilesExist(
          `${functionData.distDir}/package.json`,
          `${functionData.distDir}/main.js`,
          `${functionData.distDir}/.env`,
          `${functionData.distDir}/.env.local`,
          `${functionData.distDir}/.secret.local`,
        ),
      ).not.toThrow()

      // check dist package contains external imports
      const distPackage = readJson(`${functionData.distDir}/package.json`)
      const deps = distPackage['dependencies']
      expect(deps).toBeDefined()
      // firebase-admin not in the template anymore
      // expect(deps['firebase-admin']).toBeDefined()
      expect(deps['firebase-functions']).toBeDefined()

      // check bundled code contains the libcode we added
      const bundle = readFile(`${functionData.distDir}/main.js`)

      // check that node modules were not bundled, happens in e2e if nx reset not called
      // probably the earlier check for deps in the package.json already detects this scenario too
      expect(bundle).not.toContain(`require_firebase_app`)

      // our imported lib modules should be inlined in the bundle
      expect(bundle).toContain(`function ${libImport1}`)
      expect(bundle).toContain(`return "${buildableLibData.projectName}"`)
      expect(bundle).toContain(`function ${libImport2}`)
      expect(bundle).toContain(`return "${nonbuildableLibData.projectName}"`)
      expect(bundle).toContain(`function ${libImport3}`)
      expect(bundle).toContain(`return "${subDirBuildableLibData.projectName}"`)
      expect(bundle).toContain(`function ${libImport4}`)
      expect(bundle).toContain(
        `return "${subDirNonbuildableLibData.projectName}"`,
      )

      // cleanup
      await cleanFunctionAsync(functionData)
      await cleanAppAsync(appData)
    })
  })

  // test the nx-firebase sync generator
  describe('nx-firebase sync', () => {
    it('should sync firebase workspace with no changes', async () => {
      const result = await syncGeneratorAsync()
      testDebug(result.stdout)
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
        testDebug(result.stdout)
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
        testDebug(result.stdout)
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
        testDebug(result.stdout)
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
        testDebug(result.stdout)
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
        testDebug(result.stdout)
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
        testDebug(result.stdout)

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
        testDebug(result.stdout)

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
        testDebug(result.stdout)

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
        testDebug(result.stdout)

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

  //--------------------------------------------------------------------------------------------------
  // Test app targets
  //--------------------------------------------------------------------------------------------------

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
        `Running target lint for 2 projects`,
        `nx run ${functionData.projectName}:lint`,
        `nx run ${functionData2.projectName}:lint`,
        `All files pass linting`,
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

  //--------------------------------------------------------------------------------------------------
  // Test migrations
  //--------------------------------------------------------------------------------------------------

  describe('nx-firebase migrate', () => {
    it('should successfuly migrate for legacy app', async () => {
      const appData = getProjectData('apps', uniq('firebaseMigrateApp'))
      const functionData = getProjectData(
        'apps',
        uniq('firebaseMigrateFunction'),
      )
      await appGeneratorAsync(appData)
      await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)

      const result = await migrateGeneratorAsync()
      testDebug(result.stdout)
      expectStrings(result.stdout, [`Running plugin migrations for workspace`])

      // modify firebase app to be v2 schema
      const projectFile = `${appData.projectDir}/project.json`
      const projectJson = readJson<ProjectConfiguration>(projectFile)
      projectJson.targets['serve'].executor = 'nx:run-commands'
      projectJson.targets[
        'getconfig'
      ].options.command = `nx run ${appData.projectName}:firebase functions:config:get > ${appData.projectDir}/.runtimeconfig.json`
      updateFile(projectFile, JSON.stringify(projectJson, null, 3))

      // remove environment folder from app
      // cant delete in e2e, so lets just rename environment dir for now
      renameFile(
        joinPathFragments(appData.projectDir, 'environment'),
        joinPathFragments(appData.projectDir, uniq('environment')),
      )

      // modify firebase.json to be v2 schema
      const configFile = `firebase.json`
      const configJson = readJson(configFile)
      delete configJson.functions[0].ignore
      updateFile(configFile, JSON.stringify(configJson, null, 3))

      // remove globs from function project
      const functionFile = `${functionData.projectDir}/project.json`
      const functionJson = readJson<ProjectConfiguration>(functionFile)
      const options = functionJson.targets['build'].options
      const assets = options.assets as string[]
      options.assets = [assets.shift()]
      updateFile(functionFile, JSON.stringify(functionJson, null, 3))

      // run migrate script
      const result2 = await migrateGeneratorAsync()
      testDebug(result2.stdout)
      expectStrings(result2.stdout, [
        `MIGRATE Added default environment file 'environment/.env' for firebase app '${appData.projectName}'`,
        `MIGRATE Added default environment file 'environment/.env.local' for firebase app '${appData.projectName}'`,
        `MIGRATE Added default environment file 'environment/.secret.local' for firebase app '${appData.projectName}'`,
        `MIGRATE Updated getconfig target to use ignore environment directory for firebase app '${appData.projectName}'`,
        `MIGRATE Updated serve target for firebase app '${appData.projectName}'`,
        `MIGRATE Added assets glob for firebase function app '${functionData.projectName}'`,
        `UPDATE firebase.json`,
        `CREATE ${appData.projectDir}/environment/.env`,
        `CREATE ${appData.projectDir}/environment/.env.local`,
        `CREATE ${appData.projectDir}/environment/.secret.local`,
        `UPDATE ${appData.projectDir}/project.json`,
      ])

      validateProjectConfig(appData)

      //todo: validateFunctionConfig - IMPORTANT since we missed some errors in last release due to this missing test
      // where assets glob was malformed
      validateFunctionConfig(functionData, appData)

      // run it again
      const result3 = await migrateGeneratorAsync()
      testDebug(result3.stdout)
      expectStrings(result.stdout, [`Running plugin migrations for workspace`])
      expectNoStrings(result3.stdout, [
        `MIGRATE Added default environment file 'environment/.env' for firebase app '${appData.projectName}'`,
        `MIGRATE Added default environment file 'environment/.env.local' for firebase app '${appData.projectName}'`,
        `MIGRATE Added default environment file 'environment/.secret.local' for firebase app '${appData.projectName}'`,
        `MIGRATE Updated getconfig target to use ignore environment directory for firebase app '${appData.projectName}'`,
        `MIGRATE Updated serve target for firebase app '${appData.projectName}'`,
        `MIGRATE Added assets glob for firebase function app '${functionData.projectName}'`,
        `UPDATE firebase.json`,
        `CREATE ${appData.projectDir}/environment/.env`,
        `CREATE ${appData.projectDir}/environment/.env.local`,
        `CREATE ${appData.projectDir}/environment/.secret.local`,
        `UPDATE ${appData.projectDir}/project.json`,
      ])

      // expect(true).toBeFalsy()

      // cleanup
      await cleanFunctionAsync(functionData)
      await cleanAppAsync(appData)
    })
  })
})
