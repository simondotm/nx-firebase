
import { names } from '@nx/devkit'
import { runNxCommandAsync } from '@nx/plugin/testing'

const NPM_SCOPE = '@proj'

export interface ProjectData {
  name: string
  dir?: string
  projectName: string
  projectDir: string
  srcDir: string
  distDir: string
  mainTsPath: string
  npmScope: string
  configName: string
}

const ENABLE_DEBUG_INFO = true

export function debugInfo(info: string) {
  if (ENABLE_DEBUG_INFO) {
    console.debug(info)
  }
}

export async function safeRunNxCommandAsync(cmd: string)
{
  try {
    const result = await runNxCommandAsync(`${cmd} --verbose`, { silenceError: true })
    return result
  }
  catch (e) {
    throw e 
  }
}

export async function runTargetAsync(projectData: ProjectData, target: string = 'build') {
  const result = await safeRunNxCommandAsync(`${target} ${projectData.projectName}`)
  debugInfo(`- runTargetAsync ${target} ${projectData.projectName}`)
  debugInfo(result.stdout)
  debugInfo(result.stderr)
  expectStrings(result.stdout, [
    `Successfully ran target ${target} for project ${projectData.projectName}`
  ])   
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
  const result = await safeRunNxCommandAsync(`g @simondotm/nx-firebase:app ${projectData.name} ${params}`)
  debugInfo(`- appGeneratorAsync ${projectData.projectName}`)
  debugInfo(result.stdout)

  return result
}

export async function functionGeneratorAsync(projectData: ProjectData, params: string = '') {
  return await safeRunNxCommandAsync(`g @simondotm/nx-firebase:function ${projectData.name} ${params}`)
}

export async function syncGeneratorAsync(params: string = '') {
  return await safeRunNxCommandAsync(`g @simondotm/nx-firebase:sync ${params}`)
}

export async function cleanAppAsync(projectData: ProjectData, options = { appsRemaining:0, functionsRemaining: 0}) {
  debugInfo(`- cleanAppAsync ${projectData.projectName}`)
  await removeProjectAsync(projectData)
  const result = await syncGeneratorAsync(projectData.projectName)
  debugInfo(result.stdout)
  expect(result.stdout).toMatch(/DELETE (firebase)(\S*)(.json)/)
  expectStrings(result.stdout, [
    `This workspace has ${options.appsRemaining} firebase apps and ${options.functionsRemaining} firebase functions`,
    `CHANGE Firebase config '${projectData.configName}' is no longer referenced by any firebase app, deleted`
  ])
}  

export async function cleanFunctionAsync(projectData: ProjectData) {
  debugInfo(`- cleanFunctionAsync ${projectData.projectName}`)
  await removeProjectAsync(projectData)
}  


export function expectStrings(input: string, contains: string[]) {
  contains.forEach((item) => {
    expect(input).toContain(item)
  })
}

/**
 * Generate test project data
 * Note: call this function AFTER initial app firebase.json has been created in order to have a
 *  correct configName
 * @param name - project name (cannot be camel case)
 * @param dir - project dir
 * @returns - asset locations for this project
 */
export function getProjectData(type: 'libs' | 'apps', name: string, options?: { dir?: string, customConfig?: boolean }): ProjectData {
  const d = options?.dir ? `${names(options.dir).fileName}` : ''
  const n = names(name).fileName
  
  const prefix = options?.dir ? `${d}-` : ''
  const projectName = `${prefix}${n}`
  const rootDir = options?.dir ? `${d}/` : ''
  const distDir = `dist/${type}/${rootDir}${n}`
  return {
    name, // name passed to generator
    dir: options?.dir, // directory passed to generator
    projectName, // project name
    projectDir: `${type}/${rootDir}${n}`,
    srcDir: `${type}/${rootDir}${n}/src`,
    distDir: distDir,
    mainTsPath: `${type}/${rootDir}${n}/src/main.ts`,
    npmScope: `${NPM_SCOPE}/${projectName}`,
    configName: options?.customConfig ? `firebase.${projectName}.json` : 'firebase.json', 
  }
}
