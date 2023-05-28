// import { readJsonFile, writeJsonFile } from '@nx/devkit'
import {
  checkFilesExist,
  ensureNxProject,
  readFile,
  readJson,
  runNxCommandAsync,
  tmpProjPath,
  uniq,
  updateFile,
} from '@nx/plugin/testing'

const JEST_TIMEOUT = 120000
jest.setTimeout(JEST_TIMEOUT)

// TODO:
// check that functions are added
// check that functions build
// check that libraries can be buildable and non-buildable
// check that functions can be within firebase app folder
// check all options
// remove all tests related to old plugin
// dont check anything that the generator tests already test, this is just e2e
// check all build artefacts are correct
// check that deploy runs the application deploy?
// check that build includes building of dependent functions
// check that lint works for functions & apps
// check that test works for functions & apps
// check that serve works for apps

// DONE
// check dependent packages are installed


const appName = 'firebase'
const functionName = 'function'

const subDir = 'subdir'

const appGeneratorCommand = 'generate @simondotm/nx-firebase:app'
const functionGeneratorCommand = 'generate @simondotm/nx-firebase:function'

const libGeneratorCommand = 'generate @nx/js:lib'
const npmScope = '@proj'
const pluginName = '@simondotm/nx-firebase'
const pluginPath = 'dist/packages/nx-firebase'
const compileComplete = 'Done compiling TypeScript files for project'
const buildSuccess = 'Successfully ran target build for project'


interface ProjectData {
  name: string
  dir: string
  projectName: string
  projectDir: string
  srcDir: string
  distDir: string
  mainTsPath: string
  npmScope: string
}


// function getAppDirectories(appName: string, appDir?: string) {
//   const appPrefix = appDir ? `${appDir}-` : ''
//   const appProjectName = `${appPrefix}${appName}`
//   const appSrcDir = appDir ? `${appDir}/` : ''
//   const distDir = `dist/apps/${appSrcDir}${appName}`
//   return {
//     name: appName, // name passed to generator
//     dir: appDir, // directory passed to generator
//     projectName: appProjectName, // project name
//     projectDir: `apps/${appSrcDir}${appName}`,
//     srcDir: `apps/${appSrcDir}${appName}/src`,
//     distDir: distDir,
//     functionLibsDir: `libs`, // sub folder in distDir where the functions lib deps are copied
//     indexTsPath: `apps/${appSrcDir}${appName}/src/index.ts`,
//   }
// }

/**
 * 
 * @param name - project name (cannot be camel case)
 * @param dir - project dir
 * @returns - asset locations for this project
 */
function getDirectories(type: 'libs' | 'apps', name: string, dir?: string): ProjectData {
  const prefix = dir ? `${dir}-` : ''
  const projectName = `${prefix}${name}`
  const rootDir = dir ? `${dir}/` : ''
  const distDir = `dist/${type}/${rootDir}${appName}`
  return {
    name, // name passed to generator
    dir, // directory passed to generator
    projectName, // project name
    projectDir: `${type}/${rootDir}${name}`,
    srcDir: `${type}/${rootDir}${name}/src`,
    distDir: distDir,
    mainTsPath: `${type}/${rootDir}${appName}/src/main.ts`,
    npmScope: `${npmScope}/${projectName}`,
  }
}


// function getLibDirectories(libName: string, libDir?: string) {
//   const libPrefix = libDir ? `${libDir}-` : ''
//   const libProjectName = `${libPrefix}${libName}`
//   const libSrcDir = libDir ? `${libDir}/` : ''
//   return {
//     name: libName,
//     dir: libDir,
//     projectName: libProjectName,
//     projectDir: `libs/${libSrcDir}${libName}`,
//     srcDir: `libs/${libSrcDir}${libName}/src`,
//     npmScope: `${npmScope}/${libProjectName}`,
//     functionName: libDir
//       ? `${libDir}${libName[0].toUpperCase() + libName.substring(1)}`
//       : libName,
//   }
// }

// const appData = getAppDirectories(appName)
// const functionsData = getDirectories()
// const buildableLibData = getLibDirectories('buildablelib')
// const subDirBuildableLibData = getLibDirectories('buildablelib', 'subdir')
// const nonBuildableLibData = getLibDirectories('nonbuildablelib')
// const incompatibleLibData = getLibDirectories('incompatiblelib', 'subdir')

//const indexTs = `apps/${appName}/src/index.ts`
// let indexTsFile
const importMatch = `import * as functions from 'firebase-functions';`

// type AppDirectoryData = typeof appData
// type LibDirectoryData = typeof buildableLibData

function expectedAppFiles(projectData: ProjectData) {
  const projectPath = projectData.projectDir
  return [
    // `${projectPath}/src/index.ts`,
    // `${projectPath}/public/index.html`,
    // `${projectPath}/package.json`,
    `${projectPath}/readme.md`,
    `${projectPath}/database.rules.json`,
    `${projectPath}/firestore.indexes.json`,
    `${projectPath}/firestore.rules`,
    `${projectPath}/storage.rules`,
    `firebase.json`,
    `.firebaserc`,
  ]
}

function expectedFunctionFiles(projectData: ProjectData) {
  const projectPath = projectData.projectDir
  return [
    `${projectPath}/src/main.ts`,
    `${projectPath}/package.json`,
    // `${projectPath}/public/index.html`,
    // `${projectPath}/readme.md`,
    // `${projectPath}/database.rules.json`,
    // `${projectPath}/firestore.indexes.json`,
    // `${projectPath}/firestore.rules`,
    // `${projectPath}/storage.rules`,
    // `firebase.json`,
    // `.firebaserc`,
  ]
}

function expectedConfigFiles(
  projectData: ProjectData,
  firstProject: boolean = false,
) {
  return firstProject
    ? ['firebase.json']
    : [`firebase.${projectData.projectName}.json`]
}

/**
 * Replace content in the application `index.ts` that matches `importMatch` with `importAddition`
 * @param match - string to match in the index.ts
 * @param addition - string to add after the matched line in the index.ts
 */
function addContentToIndexTs(
  indexTsPath: string,
  match: string,
  addition: string,
) {
  updateFile(indexTsPath, (content: string) => {
    const replaced = content.replace(match, `${match}\n${addition}`)
    return replaced
  })
}

/**
 * Restore the application index.ts to initial state
 */
function resetIndexTs(indexTsPath: string, content: string) {
  updateFile(indexTsPath, content)
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
    })

    it(
      'should run nx-firebase init',
      async () => {
        await runNxCommandAsync(`generate @simondotm/nx-firebase:init`)
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
        expect(packageJson.devDependencies['@nx/linter']).toBeDefined()
        expect(packageJson.devDependencies['@nx/js']).toBeDefined()
        expect(packageJson.devDependencies['@nx/jest']).toBeDefined()
    })
  })
  
  //--------------------------------------------------------------------------------------------------
  // Application generator e2e tests
  //--------------------------------------------------------------------------------------------------

  describe('nx-firebase application', () => {

    it(
      'should create nx-firebase app',
      async () => {
        const projectData = getDirectories('apps', appName)
        await runNxCommandAsync(`${appGeneratorCommand} ${projectData.name}`)
        // test generator output
        expect(() =>
          checkFilesExist(
            ...expectedAppFiles(projectData).concat(
              expectedConfigFiles(projectData, true),
            ),
          ),
        ).not.toThrow()

        // SM: no longer needed in new plugin version
        // stash a copy of the default index.ts
        // indexTsFile = readFile(projectData.indexTsPath)
    })

    it(
      'should build nx-firebase app',
      async () => {
        const projectData = getDirectories('apps', appName)

        // test app builder
        // at this point there are no functions so it doe nothing
        const result = await runNxCommandAsync(`build ${projectData.projectName}`)
        expect(result.stdout).toContain("Build succeeded.")

        // these are now functions tests
        // expect(result.stdout).toContain(compileComplete)
        // expect(result.stdout).toContain(`${buildSuccess} ${appData.projectName}`)
        // expect(result.stdout).toContain('Updated firebase functions package.json')

        // const distDir = appData.distDir
        // expect(() =>
        //   checkFilesExist(
        //     `${distDir}/package.json`,
        //     // `${distDir}/readme.md`, // we no longer copy .md files as a default asset
        //     `${distDir}/src/index.js`,
        //   ),
        // ).not.toThrow()
    })

    describe('--directory', () => {
      it(
        'should create nx-firebase app in the specified directory',
        async () => {
          const projectData = getDirectories('apps', uniq(appName), subDir)
          await runNxCommandAsync(
            `${appGeneratorCommand} ${projectData.name} --directory ${projectData.dir}`,
          )
          expect(() =>
            checkFilesExist(
              ...expectedAppFiles(projectData).concat(
                expectedConfigFiles(projectData),
              ),
            ),
          ).not.toThrow()

          const project = readJson(`${projectData.projectDir}/project.json`)
          expect(project.name).toEqual(`${projectData.projectName}`)
      })
    })

    describe('--tags', () => {
      it(
        'should add tags to the project',
        async () => {
          const projectData = getDirectories('apps', uniq(appName))
          await runNxCommandAsync(
            `${appGeneratorCommand} ${projectData.name} --tags e2etag,e2ePackage`,
          )
          const project = readJson(`${projectData.projectDir}/project.json`)
          expect(project.tags).toEqual(['e2etag', 'e2ePackage'])
        }
        
      )
    })
  })
  
  //--------------------------------------------------------------------------------------------------
  // Function generator e2e tests
  //--------------------------------------------------------------------------------------------------

  describe('nx-firebase function', () => {
    it(
      'should not create nx-firebase function without --app',
      async () => {
        const projectData = getDirectories('apps', functionName)

        await expect(
          runNxCommandAsync(`${functionGeneratorCommand} ${projectData.name}`),
        ).rejects.toThrow(
          "Command failed: npx nx generate @simondotm/nx-firebase:function function",
        )


        // await runNxCommandAsync(`${functionGeneratorCommand} ${projectData.name}`)
        // // test generator output
        // expect(() =>
        //   checkFilesExist(
        //     ...expectedFunctionFiles(projectData).concat(
        //       expectedConfigFiles(projectData, true),
        //     ),
        //   ),
        // ).not.toThrow()

        // SM: no longer needed in new plugin version
        // stash a copy of the default index.ts
        // indexTsFile = readFile(projectData.indexTsPath)
    })

    it(
      'should create nx-firebase function',
      async () => {
        const projectData = getDirectories('apps', functionName)
        await runNxCommandAsync(`${functionGeneratorCommand} ${projectData.name} --app ${appName}`)
        // test generator output
        expect(() =>
          checkFilesExist(
            ...expectedFunctionFiles(projectData).concat(
              expectedConfigFiles(projectData, true),
            ),
          ),
        ).not.toThrow()

        // SM: no longer needed in new plugin version
        // stash a copy of the default index.ts
        // indexTsFile = readFile(projectData.indexTsPath)
    })


    // SM: DOESNT WORK IN E2E FOR SOME REASON.
    // it(
    //   'should add correct dependencies to output nx-firebase app',
    //   async () => {
    //     const distPackageFile = `${appData.distDir}/package.json`
    //     const distPackage = readJson(distPackageFile)
    //     const deps = distPackage['dependencies']
    //     expect(deps).toBeDefined()
    //     expect(deps['firebase-admin']).toBeDefined()
    //     expect(deps['firebase-functions']).toBeDefined()
    //   },
    //   JEST_TIMEOUT,
    // )

  })

  //--------------------------------------------------------------------------------------------------
  // Create Libraries for e2e function generator tests
  //--------------------------------------------------------------------------------------------------
  describe('libraries', () => {
    it(
      'should create buildable typescript library',
      async () => {
        const projectData = getDirectories('libs', 'buildablelib')        
        await runNxCommandAsync(
          `${libGeneratorCommand} ${projectData.name} --buildable --importPath="${projectData.npmScope}"`,
        )

        // no need to test the js library generator, only that it ran ok
        expect(() =>
          checkFilesExist(`${projectData.projectDir}/package.json`),
        ).not.toThrow()

        const result = await runNxCommandAsync(
          `build ${projectData.projectName}`,
        )
        expect(result.stdout).toContain(compileComplete)
        expect(result.stdout).toContain(
          `${buildSuccess} ${projectData.projectName}`,
        )
    })

    it(
      'should create buildable typescript library in subdir',
      async () => {
        const projectData = getDirectories('libs', 'buildablelib', 'subdir')           
        await runNxCommandAsync(
          `${libGeneratorCommand} ${projectData.name} --buildable --directory ${projectData.dir} --importPath="${projectData.npmScope}"`,
        )

        // no need to test the js library generator, only that it ran ok
        expect(() =>
          checkFilesExist(`${projectData.projectDir}/package.json`),
        ).not.toThrow()

        const result = await runNxCommandAsync(
          `build ${projectData.projectName}`,
        )
        expect(result.stdout).toContain(compileComplete)
        expect(result.stdout).toContain(
          `${buildSuccess} ${projectData.projectName}`,
        )
    })

    it(
      'should create non-buildable typescript library',
      async () => {
        const projectData = getDirectories('libs', 'nonbuildablelib')          
        await runNxCommandAsync(
          `${libGeneratorCommand} ${projectData.name} --buildable=false --importPath="${projectData.npmScope}"`,
        )

        expect(() =>
          checkFilesExist(`${projectData.projectDir}/package.json`),
        ).toThrow()

        const project = readJson(
          `${projectData.projectDir}/project.json`,
        )
        expect(project.targets.build).not.toBeDefined()
    })

    it(
      'should create incompatible typescript library',
      async () => {
        const projectData = getDirectories('libs', 'incompatiblelib', 'subdir')          

        await runNxCommandAsync(
          `${libGeneratorCommand} ${projectData.name} --directory=${projectData.dir}`,
        )

        expect(() =>
          checkFilesExist(`${projectData.projectDir}/package.json`),
        ).not.toThrow()

        const result = await runNxCommandAsync(
          `build ${projectData.projectName}`,
        )
        expect(result.stdout).toContain(compileComplete)
        expect(result.stdout).toContain(
          `${buildSuccess} ${projectData.projectName}`,
        )
    })
  })

  //--------------------------------------------------------------------------------------------------
  // Test import & dependency handling
  //--------------------------------------------------------------------------------------------------

  describe('nx-firebase dependencies', () => {
    // it(
    //   'should support buildable library as a dependency - new test',
    //   async () => {
    //     // ensureNxProject(pluginName, pluginPath)
    //     const libData = getLibDirectories(uniq('buildable'))
    //     const appData = getAppDirectories(uniq('functions'))
    //     // generate a buildable library
    //     await runNxCommandAsync(
    //       `${libGeneratorCommand} ${libData.name} --buildable --importPath="${libData.npmScope}"`,
    //     )
    //     // generate an application
    //     await runNxCommandAsync(`${appGeneratorCommand} ${appData.name}`)
    //     // add dependency
    //     const importAddition = `import { ${libData.functionName} } from '${libData.npmScope}'\nconsole.log(${libData.functionName}())\n`
    //     const indexTs = readFile(appData.indexTsPath)
    //     expect(indexTs).toContain(importMatch)
    //     expect(indexTs).toMatch(indexTsFile)
    //     addContentToIndexTs(appData.indexTsPath, importMatch, importAddition)
    //     expect(readFile(appData.indexTsPath)).toContain(importAddition)
    //     // build project
    //     const result3 = await runNxCommandAsync(`build ${appData.projectName}`)
    //     //        expect(result.stdout).toContain('Done compiling TypeScript files')
    //     // take it out
    //     resetIndexTs(appData.indexTsPath, indexTs)
    //     // build again
    //     const result2 = await runNxCommandAsync(`build ${appData.projectName}`)
    //     // add it back
    //     addContentToIndexTs(appData.indexTsPath, importMatch, importAddition)
    //     // build again
    //     const result = await runNxCommandAsync(`build ${appData.projectName}`)
    //     // check console output
    //     expect(result.stdout).toContain(
    //       `Added 'npm' dependency 'firebase-admin'`,
    //     )
    //     expect(result.stdout).toContain(
    //       `Added 'npm' dependency 'firebase-functions'`,
    //     )
    //     expect(result.stdout).toContain(
    //       `Copied 'lib' dependency '${libData.npmScope}'`,
    //     )
    //     expect(result.stdout).toContain(
    //       `Updated firebase functions package.json`,
    //     )
    //     // check dist outputs
    //     const functionsDistDir = `${appData.distDir}/${appData.functionLibsDir}/${libData.projectName}`
    //     expect(() =>
    //       checkFilesExist(
    //         `${functionsDistDir}/package.json`,
    //         `${functionsDistDir}/README.md`,
    //         `${functionsDistDir}/src/index.js`,
    //         `${functionsDistDir}/src/index.d.ts`,
    //         `${functionsDistDir}/src/lib/buildablelib.js`,
    //         `${functionsDistDir}/src/lib/buildablelib.d.ts`,
    //       ),
    //     ).not.toThrow()
    //     // ceheck package dependencies
    //     const distPackageFile = `${appData.distDir}/package.json`
    //     const distPackage = readJson(distPackageFile)
    //     const deps = distPackage['dependencies']
    //     expect(deps).toBeDefined()
    //     expect(deps[buildableLibData.npmScope]).toEqual(
    //       `file:${appData.functionLibsDir}/${buildableLibData.projectName}`,
    //     )
    //     expect(deps['firebase-admin']).toBeDefined()
    //     expect(deps['firebase-functions']).toBeDefined()
    //   },
    //   JEST_TIMEOUT,
    // )
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
    /*
    // check buildable lib as an imported dependency
    it(
      'should support buildable library as a dependency',
      async () => {
        // add dependency
        // resetIndexTs()
        // build project
        const projectData = appData
        const result1 = await runNxCommandAsync(
          `build ${projectData.projectName}`,
        )
        expect(result1.stdout).toContain('Done compiling TypeScript files')

        const importAddition = `import { ${buildableLibData.functionName} } from '${buildableLibData.npmScope}'\nconsole.log(${buildableLibData.functionName}())\n`
        expect(readFile(projectData.indexTsPath)).toContain(importMatch)
        expect(readFile(projectData.indexTsPath)).toMatch(indexTsFile)
        addContentToIndexTs(
          projectData.indexTsPath,
          importMatch,
          importAddition,
        )

        await new Promise((r) => setTimeout(r, 5000))
        expect(readFile(projectData.indexTsPath)).toContain(importAddition)

        // build project
        const result = await runNxCommandAsync(
          `build ${projectData.projectName}`,
        )
        expect(result.stdout).toContain('Done compiling TypeScript files')

        // check console output
        expect(result.stdout).toContain(
          `Added 'npm' dependency 'firebase-admin'`,
        )
        expect(result.stdout).toContain(
          `Added 'npm' dependency 'firebase-functions'`,
        )
        expect(result.stdout).toContain(
          `Copied 'lib' dependency '${buildableLibData.npmScope}'`,
        )
        expect(result.stdout).toContain(
          `Updated firebase functions package.json`,
        )

        // check dist outputs
        const functionsDistDir = `${projectData.distDir}/${projectData.functionLibsDir}/${buildableLibData.projectName}`
        expect(() =>
          checkFilesExist(
            `${functionsDistDir}/package.json`,
            `${functionsDistDir}/README.md`,
            `${functionsDistDir}/src/index.js`,
            `${functionsDistDir}/src/index.d.ts`,
            `${functionsDistDir}/src/lib/buildablelib.js`,
            `${functionsDistDir}/src/lib/buildablelib.d.ts`,
          ),
        ).not.toThrow()

        const distPackageFile = `${projectData.distDir}/package.json`
        const distPackage = readJson(distPackageFile)
        const deps = distPackage['dependencies']
        expect(deps).toBeDefined()

        expect(deps[buildableLibData.npmScope]).toEqual(
          `file:${projectData.functionLibsDir}/${buildableLibData.projectName}`,
        )
        expect(deps['firebase-admin']).toBeDefined()
        expect(deps['firebase-functions']).toBeDefined()
      },
      JEST_TIMEOUT,
    )

    */
  })
})
