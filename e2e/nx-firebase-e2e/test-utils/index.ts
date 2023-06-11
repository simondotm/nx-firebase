
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

export async function removeProjectAsync(name: string) {
  return await runNxCommandAsync(`g @nx/workspace:remove ${name} --forceRemove`)
}

export async function renameProjectAsync(name: string, destination: string) {
  return await runNxCommandAsync(`g @nx/workspace:move --project=${name} --destination=${destination}`)
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


export async function cleanProjectAsync(projectData: ProjectData) {
  expectStrings((await removeProjectAsync(projectData.projectName)).stdout, [
    `DELETE ${projectData.projectDir}/project.json`,
    `DELETE ${projectData.projectDir}`,
  ])    
}

export async function cleanAppAsync(projectData: ProjectData) {
  console.debug(`- cleanAppAsync ${projectData.projectName}`)
  await cleanProjectAsync(projectData)
  const result = await syncGeneratorAsync(projectData.projectName)
  console.debug(result.stdout)
  expect(result.stdout).toContain('This workspace has 0 firebase apps and 0 firebase functions')
  expect(result.stdout).toMatch(/DELETE (firebase)(\S*)(.json)/)
  // expectStrings((await syncGeneratorAsync(projectData.projectName)).stdout, [
  //     `DELETE ${projectData.configName}`,
  //   ]) 
}  
export async function cleanFunctionAsync(projectData: ProjectData) {
  console.debug(`- cleanFunctionAsync ${projectData.projectName}`)
  await cleanProjectAsync(projectData)
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
