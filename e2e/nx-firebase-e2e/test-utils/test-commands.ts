import { expectStrings, expectNoStrings } from './test-helpers'
import { testDebug, red, green } from './test-logger'
import { runNxCommandAsync } from '@nx/plugin/testing'
import { ProjectData } from './test-project-data'

const STRIP_ANSI_MATCHER = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g

export async function safeRunNxCommandAsync(cmd: string)
{
  testDebug(`- safeRunNxCommandAsync ${cmd}`)
  try {
    async function runCommand(cmd: string) {
      const result = await runNxCommandAsync(`${cmd} --verbose`, { silenceError: true })
      // strip chalk TTY ANSI codes from output
      result.stdout = result.stdout.replace(STRIP_ANSI_MATCHER, '')
      result.stderr = result.stderr.replace(STRIP_ANSI_MATCHER, '')   
      if (result.stdout) {
        testDebug(green(result.stdout))
      }
      if (result.stderr) {
        testDebug(red(result.stderr))
      }
      return result
    }
    // getting wierd lock file errors from Nx, so retry at least once
    let result = await runCommand(cmd)
    if (result.stdout.includes('LOCK-FILES-CHANGED') || result.stderr.includes('LOCK-FILES-CHANGED')) {
      testDebug(red(`Re-running command ${cmd} due to LOCK-FILES-CHANGED`))
      result = await runCommand(cmd)
    }

    return result
  }
  catch (e) {
    testDebug(red(`ERROR: Running command ${(e as Error).message}`))
    throw e 
  }
}

export async function runTargetAsync(projectData: ProjectData, target: string = 'build') {

  //SM: Mar'24 - this seems legacy, not sure if needed
  // if (target === 'build') {
  //     // need to reset Nx here for e2e test to work
  //     // otherwise it bundles node modules in the main.js output too
  //     // I think this is a problem with dep-graph, since it works if main.ts
  //     // is modified before first build      
  //     await runNxCommandAsync('reset')    
  // }
  if (target === 'build') {
    // getting wierd errors with Nx 16.8.1 where is says it cannot find the project
    // need to reset Nx here for e2e test to work
    // I dont think the Nx daemon has enough time to update its cache
    // after generation of a new project and building it right away
    await runNxCommandAsync('reset')    
  }  

  testDebug(`- runTargetAsync ${target} ${projectData.projectName}`)
  const result = await safeRunNxCommandAsync(`${target} ${projectData.projectName}`)

  if (target === 'build') {
    expectStrings(result.stdout, [
      `Successfully ran target ${target} for project ${projectData.projectName}`
    ])   
  }

  return result 
}

export async function removeProjectAsync(projectData: ProjectData) {
  const result = await safeRunNxCommandAsync(`g @nx/workspace:remove ${projectData.projectName} --forceRemove`)
  expectStrings(result.stdout, [
    `DELETE ${projectData.projectDir}/project.json`,
    `DELETE ${projectData.projectDir}`,
  ])   
  return result 
}

export async function renameProjectAsync(projectData: ProjectData, renameProjectData: ProjectData) {
  //TODO: this wont work if destination project is in a subdir
  const result = await safeRunNxCommandAsync(`g @nx/workspace:move --project=${projectData.projectName} --destination=${renameProjectData.projectName}`)
  expectStrings(result.stdout, [
    `DELETE apps/${projectData.projectName}/project.json`,
    `DELETE apps/${projectData.projectName}`,
    `CREATE apps/${renameProjectData.projectName}/project.json`,
  ])   
  return result 
}

export async function appGeneratorAsync(projectData: ProjectData, params: string = '') {
  testDebug(`- appGeneratorAsync ${projectData.projectName} ${params}`)
  const result = await safeRunNxCommandAsync(`g @simondotm/nx-firebase:app ${projectData.name} --directory=${projectData.directory} ${params}`)
  return result
}

export async function functionGeneratorAsync(projectData: ProjectData, params: string = '') {
  testDebug(`- functionGeneratorAsync ${projectData.projectName} ${params}`)
  const result = await safeRunNxCommandAsync(`g @simondotm/nx-firebase:function ${projectData.name} --directory=${projectData.directory} ${params}`)
  return result
}

export async function libGeneratorAsync(projectData: ProjectData, params: string = '') {
  testDebug(`- libGeneratorAsync ${projectData.projectName}`)
  const result = await safeRunNxCommandAsync(`g @nx/js:lib ${projectData.name} --directory=${projectData.directory} --projectNameAndRootFormat=derived ${params}`)
  return result
}

export async function syncGeneratorAsync(params: string = '') {
  testDebug(`- syncGeneratorAsync ${params}`)
  return await safeRunNxCommandAsync(`g @simondotm/nx-firebase:sync ${params}`)
}

export async function migrateGeneratorAsync(params: string = '') {
  testDebug(`- migrateGeneratorAsync ${params}`)
  return await safeRunNxCommandAsync(`g @simondotm/nx-firebase:migrate ${params}`)
}



export async function cleanAppAsync(projectData: ProjectData, options = { appsRemaining:0, functionsRemaining: 0}) {
  testDebug(`- cleanAppAsync ${projectData.projectName}`)
  await removeProjectAsync(projectData)
  const result = await syncGeneratorAsync(projectData.projectName)
  testDebug(result.stdout)
  expect(result.stdout).toMatch(/DELETE (firebase)(\S*)(.json)/)
  expectStrings(result.stdout, [
    `This workspace has ${options.appsRemaining} firebase apps and ${options.functionsRemaining} firebase functions`,
    `CHANGE Firebase config '${projectData.configName}' is no longer referenced by any firebase app, deleted`
  ])
}  

export async function cleanFunctionAsync(projectData: ProjectData) {
  testDebug(`- cleanFunctionAsync ${projectData.projectName}`)
  await removeProjectAsync(projectData)
}  

