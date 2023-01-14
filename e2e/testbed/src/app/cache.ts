import { defaultCwd } from './cwd'

export type Cache = {
  nxVersion: string
  pluginVersion: string
  rootDir: string
  testDir: string
  workspaceDir: string
  archiveFile: string
}

/**
 * compat tests are run in these directories
 * @param nxVersion
 * @param pluginVersion
 * @returns
 */
export function getCache(nxVersion: string, pluginVersion: string): Cache {
  const rootDir = `${defaultCwd}/node_modules/.cache/nx-firebase`
  const testDir = `${rootDir}/${nxVersion}`
  const workspaceDir = `${testDir}/myorg`
  const archiveFile = `${rootDir}/${nxVersion}.tar.gz`
  return {
    nxVersion,
    pluginVersion,
    rootDir,
    testDir,
    workspaceDir,
    archiveFile,
  }
}
