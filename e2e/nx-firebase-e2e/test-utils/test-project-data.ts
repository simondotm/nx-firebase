

import { joinPathFragments, names } from '@nx/devkit'

const NPM_SCOPE = '@proj'

export interface ProjectData {
  name: string
  directory: string // from Nx 16.8.0 this is the apps/libs prefix
  projectName: string
  projectDir: string
  srcDir: string
  distDir: string
  mainTsPath: string
  npmScope: string
  configName: string
}




/**
 * Generate test project data
 * Note: call this function AFTER initial app firebase.json has been created in order to have a
 *  correct configName
 * @param name - project name (cannot be camel case)
 * @param dir - project dir
 * @returns - asset locations for this project
 */
export function getProjectData(
  type: 'libs' | 'apps',
  name: string,
  options?: { dir?: string; customConfig?: boolean },
): ProjectData {
  // Nx16.8.0+ no longer adds the 'apps' or 'libs' prefix in the project name
  // --directory=${projectData.projectDir} is used instead
  // see https://nx.dev/deprecated/as-provided-vs-derived

  // we want to maintain the kebab-case name for the project/dir
  // but we need to ensure the 'apps' or 'libs' prefix is added to the --directory

  // const dir = options?.dir ? `${names(options.dir).fileName}` : ''
  const d = options?.dir ? `${names(options.dir).fileName}` : ''
  const dir = joinPathFragments(type, d)

  // project name is kebab case dir + name
  const n = names(name).fileName
  const prefix = options?.dir ? `${d}-` : ''
  const projectName = `${prefix}${n}`

  const projectDir = joinPathFragments(dir, n)

  const srcDir = joinPathFragments(projectDir, 'src')
  const mainTsPath = joinPathFragments(srcDir, 'main.ts')
  const distDir = joinPathFragments('dist', projectDir)

  return {
    name, // name passed to generator
    directory: dir, // --directory option required for generators
    projectName, // project name
    projectDir,
    srcDir,
    distDir,
    mainTsPath,
    npmScope: `${NPM_SCOPE}/${projectName}`,
    configName: options?.customConfig
      ? `firebase.${projectName}.json`
      : 'firebase.json',
  }
}