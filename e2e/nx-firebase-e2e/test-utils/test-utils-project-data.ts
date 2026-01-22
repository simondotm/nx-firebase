import { joinPathFragments } from '@nx/devkit'

const NPM_SCOPE = '@proj'

export interface ProjectData {
  name: string
  directory: string // the --directory option value for generators
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
 *
 * Nx 20+ uses "as-provided" naming only:
 * - projectName = name (exactly as provided)
 * - projectRoot = directory (exactly as provided)
 *
 * To maintain backwards compatibility with the original e2e test behavior:
 * - The `type` parameter ('apps' or 'libs') is used as the directory prefix
 * - If `dir` option is provided, projects are nested under it: type/dir/name
 * - Project names must be unique (tests use uniq() for this)
 * - This ensures projectRoot (e.g., 'apps/my-app') differs from projectName (e.g., 'my-app')
 *   which is important because @nx/workspace:move does string replacement of project roots
 *
 * Note: call this function AFTER initial app firebase.json has been created in order to have a
 *  correct configName
 * @param type - 'libs' or 'apps' - used as directory prefix to match original test behavior
 * @param name - project name (must be unique, tests use uniq() for this)
 * @param options - optional directory and customConfig settings
 * @returns - asset locations for this project
 */
export function getProjectData(
  type: 'libs' | 'apps',
  name: string,
  options?: { dir?: string; customConfig?: boolean },
): ProjectData {
  // Project name is exactly as provided (must be unique across workspace)
  const projectName = name

  // Use the type ('apps' or 'libs') as the base directory prefix
  // If additional dir is provided, nest under that as well
  // This maintains the original e2e test folder structure
  const directory = options?.dir
    ? joinPathFragments(type, options.dir, name)
    : joinPathFragments(type, name)

  // Project directory is exactly the directory (which is the full project root)
  const projectDir = directory

  const srcDir = joinPathFragments(projectDir, 'src')
  const mainTsPath = joinPathFragments(srcDir, 'main.ts')
  const distDir = joinPathFragments('dist', projectDir)

  return {
    name: projectName, // name passed to generator
    directory, // --directory option for generators (full project root path)
    projectName, // project name (must be unique)
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
