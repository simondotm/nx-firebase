
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

const ENABLE_DEBUG_INFO = false

export function debugInfo(info: string) {
  if (ENABLE_DEBUG_INFO) {
    console.debug(info)
  }
}

export async function removeProjectAsync(projectData: ProjectData) {
  const result = await runNxCommandAsync(`g @nx/workspace:remove ${projectData.projectName} --forceRemove`)
  expectStrings(result.stdout, [
    `DELETE ${projectData.projectDir}/project.json`,
    `DELETE ${projectData.projectDir}`,
  ])   
  return result 
}

export async function renameProjectAsync(projectData: ProjectData, renameProjectData: ProjectData) {
  //TODO: this wont work if destination project is in a subdir
  const result = await runNxCommandAsync(`g @nx/workspace:move --project=${projectData.projectName} --destination=${renameProjectData.projectName}`)
  expectStrings(result.stdout, [
    `DELETE apps/${projectData.projectName}/project.json`,
    `DELETE apps/${projectData.projectName}`,
    `CREATE apps/${renameProjectData.projectName}/project.json`,
  ])   
  return result 
}

export async function appGeneratorAsync(params: string = '') {
  return await runNxCommandAsync(`g @simondotm/nx-firebase:app ${params}`)
}

export async function functionGeneratorAsync(params: string = '') {
  return await runNxCommandAsync(`g @simondotm/nx-firebase:function ${params}`)
}

export async function syncGeneratorAsync(params: string = '') {
  return await runNxCommandAsync(`g @simondotm/nx-firebase:sync ${params}`)
}

export async function cleanAppAsync(projectData: ProjectData) {
  debugInfo(`- cleanAppAsync ${projectData.projectName}`)
  await removeProjectAsync(projectData)
  const result = await syncGeneratorAsync(projectData.projectName)
  debugInfo(result.stdout)
  expect(result.stdout).toMatch(/DELETE (firebase)(\S*)(.json)/)
  expectStrings(result.stdout, [
    'This workspace has 0 firebase apps and 0 firebase functions',
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
 * 
 * @param name - project name (cannot be camel case)
 * @param dir - project dir
 * @returns - asset locations for this project
 */
export function getDirectories(type: 'libs' | 'apps', name: string, dir?: string): ProjectData {
  const d = dir ? `${names(dir).fileName}` : ''
  const n = names(name).fileName
  
  const prefix = dir ? `${d}-` : ''
  const projectName = `${prefix}${n}`
  const rootDir = dir ? `${d}/` : ''
  const distDir = `dist/${type}/${rootDir}${n}`
  return {
    name, // name passed to generator
    dir, // directory passed to generator
    projectName, // project name
    projectDir: `${type}/${rootDir}${n}`,
    srcDir: `${type}/${rootDir}${n}/src`,
    distDir: distDir,
    mainTsPath: `${type}/${rootDir}${n}/src/main.ts`,
    npmScope: `${NPM_SCOPE}/${projectName}`,
    // for testing, configName is always derived from project name when app is generated
    // apart from first project which is firebase.json
    configName: `firebase.${projectName}.json`, 
  }
}
