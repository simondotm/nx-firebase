import {
  readJson,
  uniq,
  updateFile,
  renameFile,
} from '@nx/plugin/testing'

import {
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
} from '../test-utils'
import { ProjectConfiguration, joinPathFragments } from '@nx/devkit'

//--------------------------------------------------------------------------------------------------
// Test migrations
//--------------------------------------------------------------------------------------------------
export function testMigrate() {
  describe('nx-firebase migrate', () => {
    it(
      'should successfuly migrate for legacy app',
      async () => {
        const appData = getProjectData('apps', uniq('firebaseMigrateApp'))
        const functionData = getProjectData('apps', uniq('firebaseMigrateFunction'))
        await appGeneratorAsync(appData)
        await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)
        
        const result = await migrateGeneratorAsync()
        // testDebug(result.stdout)
        expectStrings(result.stdout, [
          `Running plugin migrations for workspace`,
        ])

        // modify firebase app to be v2 schema
        const projectFile = `${appData.projectDir}/project.json`
        const projectJson = readJson<ProjectConfiguration>(projectFile)
        projectJson.targets["serve"].executor = "nx:run-commands"
        projectJson.targets["getconfig"].options.command = `nx run ${appData.projectName}:firebase functions:config:get > ${appData.projectDir}/.runtimeconfig.json`
        updateFile(projectFile, JSON.stringify(projectJson, null, 3))

        // remove environment folder from app
        // cant delete in e2e, so lets just rename environment dir for now
        renameFile(joinPathFragments(appData.projectDir, 'environment'), joinPathFragments(appData.projectDir, uniq('environment')))

        // modify firebase.json to be v2 schema
        const configFile = `firebase.json`
        const configJson = readJson(configFile)
        delete configJson.functions[0].ignore
        updateFile(configFile, JSON.stringify(configJson, null, 3))


        // remove globs from function project
        const functionFile = `${functionData.projectDir}/project.json`
        const functionJson = readJson<ProjectConfiguration>(functionFile)
        const options = functionJson.targets["build"].options
        const assets = options.assets as string[]
        options.assets = [ assets.shift() ]
        updateFile(functionFile, JSON.stringify(functionJson, null, 3))

        // run migrate script
        const result2 = await migrateGeneratorAsync()
        // testDebug(result2.stdout)
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
        // testDebug(result3.stdout)
        expectStrings(result.stdout, [
          `Running plugin migrations for workspace`,
        ])        
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
}