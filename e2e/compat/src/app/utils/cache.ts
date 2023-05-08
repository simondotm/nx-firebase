import { defaultCwd } from './cwd'

export const localPluginVersion = 'local'

export type Cache = {
  nxVersion: string
  pluginVersion: string
  rootDir: string
  testDir: string
  workspaceDir: string
  archiveFile: string
  pluginWorkspace: string
  disableDaemon: boolean
  isLocalPlugin: boolean
  deferPluginInstall: boolean // defer plugin installs to the test suite rather than the workspace setup
  nodeVersion: number // major node version
}

/**
 * compat tests are run in these directories
 * @param nxVersion
 * @param pluginVersion
 * @returns
 */
export function getCache(nxVersion: string, pluginVersion: string): Cache {
  const rootDir = `${defaultCwd}/node_modules/.cache/nx-firebase/${pluginVersion}`
  const testDir = `${rootDir}/${nxVersion}`
  const archiveFile = `${rootDir}/${nxVersion}.tar.gz`
  const workspaceDir = `${testDir}/myorg`
  const pluginWorkspace = defaultCwd
  const isLocalPlugin = pluginVersion === localPluginVersion
  return {
    nxVersion,
    pluginVersion,
    rootDir,
    testDir,
    workspaceDir,
    archiveFile,
    pluginWorkspace,
    isLocalPlugin,
    deferPluginInstall: true, // dont think this is needed after all, was introduced because we had an issue from not installing @nx/js plugin
    disableDaemon: false,
    // disableDaemon:  isLocalPlugin,
    // deferPluginInstall: isLocalPlugin, // for local plugin tests, install them for tests so that code changes are present in tests
    nodeVersion: parseInt(process.versions.node.split('.')[0]),
  }
}
