import { defaultCwd } from './cwd'
import { info } from './log'
import { satisfies } from 'semver'

export const localPluginVersion = 'local'

// const CACHE_DIR = `${defaultCwd}/node_modules/.cache/nx-firebase`
const CACHE_DIR = `${defaultCwd}/.nx-firebase`
// const CACHE_DIR = `${defaultCwd}/../.nx-firebase`

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
  deferPluginInstall: boolean // defer plugin installs during each test suite rather than in the workspace setup
  nodeVersion: number // major node version
}

/**
 * compat tests are run in these directories
 * @param nxVersion
 * @param pluginVersion
 * @returns
 */
export function getCache(nxVersion: string, pluginVersion: string): Cache {
  info(
    `getting Cache for nxVersion=${nxVersion} pluginVersion=${pluginVersion}, using cache dir '${CACHE_DIR}'`,
  )
  const rootDir = `${CACHE_DIR}/${pluginVersion}`
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

export function isNxVersionSince(cache: Cache, nxVersion: string) {
  console.log(
    `checking isNxVersionSince satisfies ${cache.nxVersion} >= ${nxVersion}`,
  )
  const isOk = satisfies(cache.nxVersion, `>=${nxVersion}`)
  console.log('isNxVersionSince check returned ', isOk)
  return isOk
}
