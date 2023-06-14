import { names, readJsonFile, readProjectConfiguration, writeJsonFile } from '@nx/devkit'
import {
  checkFilesExist,
  ensureNxProject,
  readFile,
  readJson,
  runNxCommandAsync,
  uniq,
  updateFile,
  tmpProjPath,
} from '@nx/plugin/testing'

import { ProjectData, appGeneratorAsync, cleanAppAsync, cleanFunctionAsync, debugInfo, expectStrings, functionGeneratorAsync, getDirectories, removeProjectAsync, renameProjectAsync, syncGeneratorAsync } from '../test-utils'


const JEST_TIMEOUT = 120000
jest.setTimeout(JEST_TIMEOUT)


// TODO:
// check that functions can be within firebase app folder
// check all options
// remove all tests related to old plugin
// dont check anything that the generator tests already test, this is just e2e
// check that deploy runs the application deploy?
// check that lint works for functions & apps
// check that test works for functions & apps
// check that serve works for apps

// DONE
// check dependent packages are installed
// check that functions are added
// check that functions build
// check all build artefacts are correct
// check that libraries can be buildable and non-buildable
// check that build includes building of dependent functions


const appName = 'firebase'
const functionName = 'function'

const subDir = 'subdir'



const libGeneratorCommand = 'generate @nx/js:lib'

const pluginName = '@simondotm/nx-firebase'
const pluginPath = 'dist/packages/nx-firebase'
const compileComplete = 'Done compiling TypeScript files for project'
const buildSuccess = 'Successfully ran target build for project'



/**
 * return the import function for a generated library
 */
function getLibImport(projectData: ProjectData) {
  const libName = projectData.name
  const libDir = projectData.dir
  return libDir
      ? `${libDir}${libName[0].toUpperCase() + libName.substring(1)}`
      : libName
}


const importMatch = `import * as functions from 'firebase-functions';`

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

/**
 * Replace content in the application `main.ts` that matches `importMatch` with `importAddition`
 * @param match - string to match in the index.ts
 * @param addition - string to add after the matched line in the index.ts
 */
function addContentToMainTs(
  mainTsPath: string,
  match: string,
  addition: string,
) {
  updateFile(mainTsPath, (content: string) => {
    const replaced = content.replace(match, `${match}\n${addition}`)
    return replaced
  })
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
      'should create workspace without nx dependencies',
      async () => {
        // test that generator adds dependencies to workspace package.json
        // should not be initially set
        const packageJson = readJson(`package.json`)
        expect(packageJson.devDependencies['@nx/node']).toBeUndefined()
        expect(packageJson.devDependencies['@nx/esbuild']).toBeUndefined()
        expect(packageJson.devDependencies['@nx/linter']).toBeUndefined()
        expect(packageJson.devDependencies['@nx/js']).toBeUndefined()
        expect(packageJson.devDependencies['@nx/jest']).toBeUndefined()
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
        const appData = getDirectories('apps', uniq(appName))
        await appGeneratorAsync(`${appData.name}`)
        // test generator output
        expect(() =>
          checkFilesExist(
            ...expectedAppFiles(appData),
          ),
        ).not.toThrow()

        // cleanup - app
        await cleanAppAsync(appData)
    })

    it(
      'should build nx-firebase app',
      async () => {
        const appData = getDirectories('apps', uniq(appName))
        await appGeneratorAsync(`${appData.name}`)

        // test app builder
        // at this point there are no functions so it doe nothing
        const result = await runNxCommandAsync(`build ${appData.projectName}`)
        expect(result.stdout).toContain("Build succeeded.")

        // cleanup - app
        await cleanAppAsync(appData)        
    })

    describe('--directory', () => {
      it(
        'should create nx-firebase app in the specified directory',
        async () => {
          const appData = getDirectories('apps', uniq(appName), subDir)
          await appGeneratorAsync(
            `${appData.name} --directory ${appData.dir}`,
          )
          expect(() =>
            checkFilesExist(
              ...expectedAppFiles(appData),
            ),
          ).not.toThrow()

          const project = readJson(`${appData.projectDir}/project.json`)
          expect(project.name).toEqual(`${appData.projectName}`)

          // cleanup - app
          await cleanAppAsync(appData)                
      })
    })

    describe('--tags', () => {
      it(
        'should add tags to the project',
        async () => {
          const appData = getDirectories('apps', uniq(appName))
          await appGeneratorAsync(
            `${appData.name} --tags e2etag,e2ePackage`,
          )
          const project = readJson(`${appData.projectDir}/project.json`)
          expect(project.tags).toEqual(['firebase:app', `firebase:name:${appData.name}`, 'e2etag', 'e2ePackage'])

          // cleanup - app
          await cleanAppAsync(appData)  
        }
        
      )
    })
  })
  
  // //--------------------------------------------------------------------------------------------------
  // // Function generator e2e tests
  // //--------------------------------------------------------------------------------------------------

  // describe('nx-firebase function', () => {
  //   it(
  //     'should not create nx-firebase function without --app',
  //     async () => {
  //       const projectData = getDirectories('apps', functionName)

  //       await expect(
  //         runNxCommandAsync(`${functionGeneratorCommand} ${projectData.name}`),
  //       ).rejects.toThrow(
  //         "Command failed: npx nx generate @simondotm/nx-firebase:function function",
  //       )
  //   })

  //   it(
  //     'should create nx-firebase function',
  //     async () => {
  //       const projectData = getDirectories('apps', functionName)
  //       await runNxCommandAsync(`${functionGeneratorCommand} ${projectData.name} --app ${appName}`)
  //       // test generator output
  //       expect(() =>
  //         checkFilesExist(
  //           ...expectedFunctionFiles(projectData).concat(
  //             expectedConfigFiles(projectData, true),
  //           ),
  //         ),
  //       ).not.toThrow()

  //       // check dist files dont exist and we havent accidentally run this test out of sequence
  //       const functionsProjectData = getDirectories('apps', functionName)
  //       expect(() =>
  //         checkFilesExist(
  //           `dist/${functionsProjectData.projectDir}/main.js`,
  //           `dist/${functionsProjectData.projectDir}/package.json`,
  //           ),
  //       ).toThrow()   
  //   })

  //   it(
  //     'should build nx-firebase function from the app',
  //     async () => {
  //       const projectData = getDirectories('apps', appName)
  //       const result = await runNxCommandAsync(`build ${projectData.name}`)
  //       expect(result.stdout).toContain("Build succeeded.")        

  //       const functionsProjectData = getDirectories('apps', functionName)
  //       expect(() =>
  //         checkFilesExist(
  //           `dist/${functionsProjectData.projectDir}/main.js`,
  //           `dist/${functionsProjectData.projectDir}/package.json`,
  //           ),
  //       ).not.toThrow()        
  //   })

  //   it(
  //     'should build nx-firebase function directly',
  //     async () => {
  //       const projectData = getDirectories('apps', functionName)
  //       const result = await runNxCommandAsync(`build ${projectData.name}`)
  //       expect(result.stdout).toContain("dist/apps/function/main.js")        
  //       expect(result.stdout).toContain("Successfully ran target build for project function")        
  //   })


  //   it(
  //     'should add correct dependencies to the built function package.json',
  //     async () => {
  //       const projectData = getDirectories('apps', functionName)
  //       const distPackageFile = `${projectData.distDir}/package.json`
  //       const distPackage = readJson(distPackageFile)
  //       const deps = distPackage['dependencies']
  //       expect(deps).toBeDefined()
  //       expect(deps['firebase-admin']).toBeDefined()
  //       expect(deps['firebase-functions']).toBeDefined()
  //   })

  //   it(
  //     'should add tags to the function project',
  //     async () => {
  //       const projectData = getDirectories('apps', uniq(functionName))
  //       await runNxCommandAsync(
  //         `${functionGeneratorCommand} ${projectData.name} --app ${appName} --tags e2etag,e2ePackage`,
  //       )
  //       const project = readJson(`${projectData.projectDir}/project.json`)
  //       expect(project.tags).toEqual([
  //         'firebase:function',
  //         `firebase:name:${projectData.name}`,
  //         `firebase:dep:${appName}`,
  //         'e2etag',
  //         'e2ePackage',
  //       ])
  //     }
      
  //   )
 

  // })

  // //--------------------------------------------------------------------------------------------------
  // // Create Libraries for e2e function generator tests
  // //--------------------------------------------------------------------------------------------------
  // describe('libraries', () => {
  //   it(
  //     'should create buildable typescript library',
  //     async () => {
  //       const projectData = getDirectories('libs', 'buildablelib')        
  //       await runNxCommandAsync(
  //         `${libGeneratorCommand} ${projectData.name} --buildable --importPath="${projectData.npmScope}"`,
  //       )

  //       // no need to test the js library generator, only that it ran ok
  //       expect(() =>
  //         checkFilesExist(`${projectData.projectDir}/package.json`),
  //       ).not.toThrow()

  //       const result = await runNxCommandAsync(
  //         `build ${projectData.projectName}`,
  //       )
  //       expect(result.stdout).toContain(compileComplete)
  //       expect(result.stdout).toContain(
  //         `${buildSuccess} ${projectData.projectName}`,
  //       )
  //   })

  //   it(
  //     'should create buildable typescript library in subdir',
  //     async () => {
  //       const projectData = getDirectories('libs', 'buildablelib', 'subdir')           
  //       await runNxCommandAsync(
  //         `${libGeneratorCommand} ${projectData.name} --buildable --directory=${projectData.dir} --importPath="${projectData.npmScope}"`,
  //       )

  //       // no need to test the js library generator, only that it ran ok
  //       expect(() =>
  //         checkFilesExist(`${projectData.projectDir}/package.json`),
  //       ).not.toThrow()

  //       const result = await runNxCommandAsync(
  //         `build ${projectData.projectName}`,
  //       )
  //       expect(result.stdout).toContain(compileComplete)
  //       expect(result.stdout).toContain(
  //         `${buildSuccess} ${projectData.projectName}`,
  //       )
  //   })

  //   it(
  //     'should create non-buildable typescript library',
  //     async () => {
  //       const projectData = getDirectories('libs', 'nonbuildablelib')          
  //       await runNxCommandAsync(
  //         `${libGeneratorCommand} ${projectData.name} --buildable=false --importPath="${projectData.npmScope}"`,
  //       )

  //       expect(() =>
  //         checkFilesExist(`${projectData.projectDir}/package.json`),
  //       ).toThrow()

  //       const project = readJson(
  //         `${projectData.projectDir}/project.json`,
  //       )
  //       expect(project.targets.build).not.toBeDefined()
  //   })

  //   it(
  //     'should create non-buildable typescript library in subdir',
  //     async () => {
  //       const projectData = getDirectories('libs', 'nonbuildablelib', 'subdir')          

  //       await runNxCommandAsync(
  //         `${libGeneratorCommand} ${projectData.name} --directory=${projectData.dir} --buildable=false --importPath="${projectData.npmScope}"`,
  //       )

  //       expect(() =>
  //         checkFilesExist(`${projectData.projectDir}/package.json`),
  //       ).toThrow()

  //       const project = readJson(
  //         `${projectData.projectDir}/project.json`,
  //       )
  //       expect(project.targets.build).not.toBeDefined()
  //   })
  // })

  // //--------------------------------------------------------------------------------------------------
  // // Test import & dependency handling
  // //--------------------------------------------------------------------------------------------------

  // describe('nx-firebase dependencies', () => {
  //   it(
  //     'should inline library dependencies into function bundle',
  //     async () => {
  //       // use libs we generated earler
       
  //       // generate a function
  //       const functionData = getDirectories('apps', 'functionwithdeps')
  //       await runNxCommandAsync(`${functionGeneratorCommand} ${functionData.name} --app firebase`)
        
  //       // add buildable & nonbuildable lib dependencies using import statements
  //       const mainTs = readFile(functionData.mainTsPath)
  //       expect(mainTs).toContain(importMatch)

  //       // import from a buildable lib
  //       const buildableLibData = getDirectories('libs', 'buildablelib')
  //       const libImport1 = getLibImport(buildableLibData)
  //       const importAddition1 = `import { ${libImport1} } from '${buildableLibData.npmScope}'\nconsole.log(${libImport1}())\n`
  //       addContentToMainTs(functionData.mainTsPath, importMatch, importAddition1)

  //       // import from a non buildable lib
  //       const nonbuildableLibData = getDirectories('libs', 'nonbuildablelib')
  //       const libImport2 = getLibImport(nonbuildableLibData)
  //       const importAddition2 = `import { ${libImport2} } from '${nonbuildableLibData.npmScope}'\nconsole.log(${libImport2}())\n`
  //       addContentToMainTs(functionData.mainTsPath, importMatch, importAddition2)

  //       // import from a buildable subdir lib
  //       const subDirBuildableLibData = getDirectories('libs', 'buildablelib', 'subdir')
  //       const libImport3 = getLibImport(subDirBuildableLibData)
  //       const importAddition3 = `import { ${libImport3} } from '${subDirBuildableLibData.npmScope}'\nconsole.log(${libImport3}())\n`
  //       addContentToMainTs(functionData.mainTsPath, importMatch, importAddition3)

  //       // import from a non buildable subdir lib
  //       const subDirNonbuildableLibData = getDirectories('libs', 'nonbuildablelib', 'subdir')
  //       const libImport4 = getLibImport(subDirNonbuildableLibData)
  //       const importAddition4 = `import { ${libImport4} } from '${subDirNonbuildableLibData.npmScope}'\nconsole.log(${libImport4}())\n`
  //       addContentToMainTs(functionData.mainTsPath, importMatch, importAddition4)


  //       // confirm the file changes
  //       expect(readFile(functionData.mainTsPath)).toContain(importAddition1)
  //       expect(readFile(functionData.mainTsPath)).toContain(importAddition2)
  //       expect(readFile(functionData.mainTsPath)).toContain(importAddition3)
  //       expect(readFile(functionData.mainTsPath)).toContain(importAddition4)

  //       // need to reset Nx here for e2e test to work
  //       // otherwise it bundles node modules in the main.js output too
  //       await runNxCommandAsync('reset')

  //       // build
  //       const result = await runNxCommandAsync(`build ${functionData.projectName}`)
  //       // check console output
  //       expect(result.stdout).toContain(
  //         `Successfully ran target build for project ${functionData.projectName}`,
  //       )

  //       // check dist outputs
  //       expect(() =>
  //         checkFilesExist(
  //           `${functionData.distDir}/package.json`,
  //           `${functionData.distDir}/main.js`,
  //         ),
  //       ).not.toThrow()

  //       // check dist package contains external imports
  //       const distPackage = readJson(`${functionData.distDir}/package.json`)
  //       const deps = distPackage['dependencies']
  //       expect(deps).toBeDefined()
  //       expect(deps['firebase-admin']).toBeDefined()
  //       expect(deps['firebase-functions']).toBeDefined()        

  //       // check bundled code contains the libcode we added
  //       const bundle = readFile(`${functionData.distDir}/main.js`)

  //       // check that node modules were not bundled, happens in e2e if nx reset not called
  //       // probably the earlier check for deps in the package.json already detects this scenario too
  //       expect(bundle).not.toContain(`require_firebase_app`)  

  //       // our imported lib modules should be inlined in the bundle
  //       expect(bundle).toContain(`function ${libImport1}`)  
  //       expect(bundle).toContain(`return "${buildableLibData.projectName}"`)  
  //       expect(bundle).toContain(`function ${libImport2}`)  
  //       expect(bundle).toContain(`return "${nonbuildableLibData.projectName}"`)  
  //       expect(bundle).toContain(`function ${libImport3}`)  
  //       expect(bundle).toContain(`return "${subDirBuildableLibData.projectName}"`)  
  //       expect(bundle).toContain(`function ${libImport4}`)  
  //       expect(bundle).toContain(`return "${subDirNonbuildableLibData.projectName}"`)  
  //   })

  // })




  describe('nx-firebase sync', () => {


    it(
      'should sync firebase workspace with no changes',
      async () => {
        const result = await syncGeneratorAsync()
        debugInfo(result.stdout)
        expect(result.stdout).not.toContain('CHANGE')
        expect(result.stdout).not.toContain('UPDATE')
        expect(result.stdout).not.toContain('CREATE')
        expect(result.stdout).not.toContain('DELETE')  
    })

    describe('--project', () => {
      it(
        'should set firebase app project using --project',
        async () => {
          // create firebase app without specifying firebase deploy --project
          const appData = getDirectories('apps', uniq('firebaseSyncApp'))
          await appGeneratorAsync(`${appData.name}`)

          expect(readJson(`${appData.projectDir}/project.json`).targets.firebase.options.command).not.toContain(
            `--project`
          ) 
          const result = await syncGeneratorAsync(`--app=${appData.projectName} --project=test`)
          debugInfo(result.stdout)
          expectStrings(result.stdout, [
            `CHANGE setting firebase target --project for '${appData.projectName}' to '--project=test'`,
            `UPDATE apps/${appData.projectName}/project.json`,
          ])
          expect(readJson(`${appData.projectDir}/project.json`).targets.firebase.options.command).toContain(
            `--project=test`
          )
          // cleanup - app
          await cleanAppAsync(appData)
      })    

      it(
        'should update firebase app project using --project',
        async () => {
          
          // create firebase app specifying firebase deploy --project        
          const appData = getDirectories('apps', uniq('firebaseSyncApp'))
          await appGeneratorAsync(`${appData.name} --project=test`)

          expect(readJson(`${appData.projectDir}/project.json`).targets.firebase.options.command).toContain(
            `--project=test`
          ) 
          const result = await syncGeneratorAsync(`--app=${appData.projectName} --project=test2`)
          debugInfo(result.stdout)
          expectStrings(result.stdout, [
            `CHANGE updating firebase target --project for '${appData.projectName}' to '--project=test2'`,
            `UPDATE apps/${appData.projectName}/project.json`,
          ])
          expect(readJson(`${appData.projectDir}/project.json`).targets.firebase.options.command).toContain(
            `--project=test2`
          )

          // cleanup - app
          await cleanAppAsync(appData)
      })
    })

    describe('deletions', () => {

      it(
        'should detect deleted firebase functions',
        async () => {
          const appData = getDirectories('apps', uniq('firebaseSyncApp'))
          const functionData = getDirectories('apps', uniq('firebaseSyncFunction'))
          await appGeneratorAsync(`${appData.name}`)
          await functionGeneratorAsync(`${functionData.name} --app ${appData.name}`)

          await removeProjectAsync(functionData)

          const result = await syncGeneratorAsync()
          debugInfo(result.stdout)
          expectStrings(result.stdout, [
            `  SYNC Firebase function '${functionData.projectName}' has been deleted`,
            `CHANGE deleted firebase function '${functionData.projectName}' from 'firebase.${appData.projectName}.json`,
            `UPDATE ${appData.configName}`,
          ])          

          // cleanup - app only, already removed function
          await cleanAppAsync(appData)     
      })

      it(
        'should detect deleted firebase apps',
        async () => {
          const appData = getDirectories('apps', uniq('firebaseSyncApp'))
          const functionData = getDirectories('apps', uniq('firebaseSyncFunction'))
          await appGeneratorAsync(`${appData.name}`)
          await functionGeneratorAsync(`${functionData.name} --app ${appData.name}`)

          await removeProjectAsync(appData)

          const result = await syncGeneratorAsync()
          debugInfo(result.stdout)
          expectStrings(result.stdout, [
            `  SYNC Firebase app '${appData.projectName}' has been deleted`,
            // `CHANGE ${appData.projectName} app was deleted, removing its firebase config file ${appData.configName}`,  
            `CHANGE orphaned firebase function '${functionData.projectName}', cannot locate firebase application '${appData.projectName}'`,
            // `DELETE ${appData.configName}`,
          ])
      
          // cleanup - function only, already removed app
          await cleanFunctionAsync(functionData)      
      })
    })

    describe('renames', () => {    

      it(
        'should detect renamed firebase functions',
        async () => {
          const appData = getDirectories('apps', uniq('firebaseSyncApp'))
          const functionData = getDirectories('apps', uniq('firebaseSyncFunction'))
          const renamedFunctionData = getDirectories('apps', uniq('firebaseSyncFunction'))
          await appGeneratorAsync(`${appData.name}`)
          await functionGeneratorAsync(`${functionData.name} --app ${appData.name}`)

          await renameProjectAsync(functionData, renamedFunctionData)

          const result = await syncGeneratorAsync()
          debugInfo(result.stdout)

          expectStrings(result.stdout, [
            `  SYNC Firebase function '${renamedFunctionData.projectName}' has been renamed from '${functionData.projectName}'`,
            `CHANGE Firebase function '${functionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated firebase:name tag`,
            `CHANGE renamed firebase function codebase from '${functionData.projectName}' to '${renamedFunctionData.projectName}' in '${appData.configName}'`,
            `CHANGE Firebase function '${functionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated deploy target to '--only=functions:${renamedFunctionData.projectName}'`,
            // `CHANGE updated firebase function name tag for firebase function '${renamedFunctionData.projectName}', renamed from '${functionData.projectName}' to 'firebase:name:${renamedFunctionData.projectName}'`,
            // `CHANGE updated deploy command for firebase function, renamed from '${functionData.projectName}' to '${renamedFunctionData.projectName}'`,
            `UPDATE apps/${renamedFunctionData.projectName}/project.json`,
            `UPDATE ${appData.configName}`,
          ])
      
          // cleanup - function, then app
          await cleanFunctionAsync(renamedFunctionData)
          await cleanAppAsync(appData)
        })


      it(
        'should detect renamed firebase apps',
        async () => {
          const appData = getDirectories('apps', uniq('firebaseSyncApp'))
          const functionData = getDirectories('apps', uniq('firebaseSyncFunction'))
          const renamedAppData = getDirectories('apps', uniq('firebaseSyncApp'))
          await appGeneratorAsync(`${appData.name}`)
          await functionGeneratorAsync(`${functionData.name} --app ${appData.name}`)

          await renameProjectAsync(appData, renamedAppData)

          const result = await syncGeneratorAsync()
          debugInfo(result.stdout)

          expectStrings(result.stdout, [
            `  SYNC Firebase app '${renamedAppData.projectName}' has been renamed from '${appData.projectName}'`,
            // `CHANGE firebase app name tag for renamed firebase app '${renamedAppData.projectName}' from '${appData.projectName}' to 'firebase:name:${renamedAppData.projectName}'`,
            `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:name tag`,
            `CHANGE updated firebase:dep tag in firebase function '${functionData.projectName}' from '${appData.projectName}' to renamed to firebase app '${renamedAppData.projectName}'`,
            `UPDATE apps/${renamedAppData.projectName}/project.json`,
            `UPDATE apps/${functionData.projectName}/project.json`,
          ])
      
          // run another sync to check there should be no orphaned functions from an app rename
          const result2 = await syncGeneratorAsync()
          expect(result2.stdout).not.toContain('CHANGE orphaned')
          expect(result2.stdout).not.toContain('UPDATE')

          // cleanup - function, then app
          await cleanFunctionAsync(functionData)
          renamedAppData.configName = appData.configName // until we have renamed configs support
          await cleanAppAsync(renamedAppData)       
        })     
        
        

      it(
        'should detect renamed firebase apps & functions',
        async () => {
          const appData = getDirectories('apps', uniq('firebaseSyncApp'))
          const functionData = getDirectories('apps', uniq('firebaseSyncFunction'))
          const renamedFunctionData = getDirectories('apps', uniq('firebaseSyncFunction'))
          const renamedAppData = getDirectories('apps', uniq('firebaseSyncApp'))

          await appGeneratorAsync(`${appData.name}`)
          await functionGeneratorAsync(`${functionData.name} --app ${appData.name}`)

          // rename app & function
          await renameProjectAsync(appData, renamedAppData)
          await renameProjectAsync(functionData, renamedFunctionData)

          const result = await syncGeneratorAsync()
          debugInfo(result.stdout)

          expectStrings(result.stdout, [
            `  SYNC Firebase app '${renamedAppData.projectName}' has been renamed from '${appData.projectName}'`,
            `  SYNC Firebase function '${renamedFunctionData.projectName}' has been renamed from '${functionData.projectName}'`,
            `CHANGE Firebase app '${appData.projectName}' was renamed to '${renamedAppData.projectName}', updated firebase:name tag`,
            `CHANGE Firebase function '${functionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated firebase:name tag`,
            `CHANGE Firebase function '${functionData.projectName}' was renamed to '${renamedFunctionData.projectName}', updated deploy target to '--only=functions:${renamedFunctionData.projectName}'`,

            // `CHANGE firebase app name tag for renamed firebase app '${renamedAppData.projectName}' from '${appData.projectName}' to 'firebase:name:${renamedAppData.projectName}'`,
            `CHANGE updated firebase:dep tag in firebase function '${renamedFunctionData.projectName}' from '${appData.projectName}' to renamed to firebase app '${renamedAppData.projectName}'`,
            `CHANGE renamed firebase function codebase from '${functionData.projectName}' to '${renamedFunctionData.projectName}' in '${appData.configName}'`,
            // `CHANGE updated firebase function name tag for firebase function '${renamedFunctionData.projectName}', renamed from '${functionData.projectName}' to 'firebase:name:${renamedFunctionData.projectName}'`,
            // `CHANGE updated deploy command for firebase function, renamed from '${functionData.projectName}' to '${renamedFunctionData.projectName}'`,
            `UPDATE apps/${renamedAppData.projectName}/project.json`,
            `UPDATE apps/${renamedFunctionData.projectName}/project.json`,
            `UPDATE ${appData.configName}`,            
          ])          

          // cleanup - function, then app
          await cleanFunctionAsync(renamedFunctionData)
          renamedAppData.configName = appData.configName // until we have renamed configs support
          await cleanAppAsync(renamedAppData)
      })


    })



  })

        // check we handle removed firebase configs from deleted apps
        // if app is renamed, shouldnt we rename firebase config too?!! :(

})
