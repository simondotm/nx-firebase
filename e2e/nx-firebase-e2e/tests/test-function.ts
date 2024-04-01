import {
  readJson,
  uniq,
  checkFilesExist,
  exists,
} from '@nx/plugin/testing'

import {
  ProjectData,
  appGeneratorAsync,
  cleanAppAsync,
  cleanFunctionAsync,
  functionGeneratorAsync,
  getProjectData,
  validateFunctionConfig,
  runTargetAsync,
  expectStrings, 
} from '../test-utils'
import { detectPackageManager } from '@nx/devkit'

const packageManager = detectPackageManager()
const packageLockFile = packageManager === 'npm' ? 'package-lock.json' : packageManager === 'pnpm' ? 'pnpm-lock.yaml' : 'yarn.lock'


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

//--------------------------------------------------------------------------------------------------
// Function generator e2e tests
//--------------------------------------------------------------------------------------------------
export function testFunction() {
  describe('nx-firebase function', () => {
    it(
      'should not create nx-firebase function without --app',
      async () => {
        const functionData = getProjectData('apps', uniq('firebaseFunction'))
        const result = await functionGeneratorAsync(functionData)
        expect(result.stdout).toContain("Required property 'app' is missing")
        // no cleanup required  
    })

    it(
      'should not create nx-firebase function with an invalid --app',
      async () => {
        const functionData = getProjectData('apps', uniq('firebaseFunction'))
        const result = await functionGeneratorAsync(functionData, '--app badapple')
        expect(result.stdout).toContain("A firebase application project called 'badapple' was not found in this workspace.")
        // no cleanup required  
    })    

    it(
      'should create nx-firebase function',
      async () => {
        const appData = getProjectData('apps', uniq('firebaseApp'))
        const functionData = getProjectData('apps', uniq('firebaseFunction'))
        await appGeneratorAsync(appData)
        await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)
        // test generator output
        expect(() =>
          checkFilesExist(
            ...expectedFunctionFiles(functionData)
          ),
        ).not.toThrow()

        // check dist files dont exist and we havent accidentally run this test out of sequence
        expect(() =>
          checkFilesExist(
            `dist/${functionData.projectDir}/main.js`,
            `dist/${functionData.projectDir}/package.json`,
            `dist/${functionData.projectDir}/${packageLockFile}`,
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

    it(
      'should build nx-firebase function from the app',
      async () => {
        const appData = getProjectData('apps', uniq('firebaseApp'))
        const functionData = getProjectData('apps', uniq('firebaseFunction'))
        await appGeneratorAsync(appData)
        await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)

        validateFunctionConfig(functionData, appData)

        const result = await runTargetAsync(appData, 'build')
        expect(result.stdout).toContain("Build succeeded.")        

        expect(() =>
          checkFilesExist(
            `dist/${functionData.projectDir}/main.js`,
            `dist/${functionData.projectDir}/package.json`,
            `dist/${functionData.projectDir}/${packageLockFile}`,
            `dist/${functionData.projectDir}/.env`,
            `dist/${functionData.projectDir}/.env.local`,
            `dist/${functionData.projectDir}/.secret.local`,
            ),
        ).not.toThrow()   

        // cleanup
        await cleanFunctionAsync(functionData)              
        await cleanAppAsync(appData)             
    })

    it(
      'should build nx-firebase function directly',
      async () => {
        const appData = getProjectData('apps', uniq('firebaseApp'))
        const functionData = getProjectData('apps', uniq('firebaseFunction'))
        await appGeneratorAsync(appData)
        await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)

        validateFunctionConfig(functionData, appData)

        const result = await runTargetAsync(functionData, 'build')
        expect(result.stdout).toContain(`nx run ${functionData.projectName}:build`)        
        // esbuild outputs to stderr for some reason
        expect(result.stderr).toContain(`${functionData.distDir}/main.js`)        
        // make sure it hasnt bundled node_modules, indicator is that bundle size is megabytes in size
        expect(result.stderr).not.toContain(`Mb`)        

        // cleanup
        await cleanFunctionAsync(functionData)              
        await cleanAppAsync(appData)         
    })


    it(
      'should add correct dependencies to the built function package.json',
      async () => {
        const appData = getProjectData('apps', uniq('firebaseApp'))
        const functionData = getProjectData('apps', uniq('firebaseFunction'))
        await appGeneratorAsync(appData)
        await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)

        validateFunctionConfig(functionData, appData)

        const result = await runTargetAsync(functionData, 'build')
        expect(result.stdout).toContain(
          `Successfully ran target build for project ${functionData.projectName}`,
        )        

        expectStrings(result.stderr, [
          `${functionData.distDir}/main.js`
        ])
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

    it(
      'should add tags to the function project',
      async () => {
        const appData = getProjectData('apps', uniq('firebaseApp'))
        const functionData = getProjectData('apps', uniq('firebaseFunction'))
        await appGeneratorAsync(appData)
        await functionGeneratorAsync(functionData, `--app ${appData.projectName}  --tags e2etag,e2ePackage`)

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
      }
    )
  })  
}
