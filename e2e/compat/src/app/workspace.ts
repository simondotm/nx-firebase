import * as fs from 'fs'
import { Cache } from './utils/cache'
import { customExec, runNxCommandAsync } from './utils/exec'
import { log } from './utils/log'
import { deleteDir, ensureDir, setCwd } from './utils/utils'

export function createTestDir(testDir: string) {
  ensureDir(testDir)
  setCwd(testDir)
}

export function workspaceExists(workspaceDir: string) {
  return fs.existsSync(workspaceDir)
}

export function cleanWorkspace(dir: string) {
  if (workspaceExists(dir)) {
    log(`Cleaning workspace '${dir}'...`)
    deleteDir(dir)
  }
}

export async function installPlugin(cache: Cache) {
  // this version of plugin has peerdeps that only work with node 14 / npm 6
  const requireLegacyPeerDeps =
    cache.nodeVersion >= 16 && cache.pluginVersion === '0.3.4'
  const legacyPeerDeps = requireLegacyPeerDeps ? '--legacy-peer-deps' : ''
  if (cache.isLocalPlugin) {
    // install the plugin from the nx-firebase workspace as a local file dependency
    await customExec(
      `npm i ${cache.pluginWorkspace}/dist/packages/nx-firebase --save-dev ${legacyPeerDeps}`,
    )
  } else {
    await customExec(
      `npm i @simondotm/nx-firebase@${cache.pluginVersion} --save-dev ${legacyPeerDeps}`,
    )
  }
}

export async function createWorkspace(cache: Cache) {
  cleanWorkspace(cache.workspaceDir)
  await customExec(
    `npx create-nx-workspace@${cache.nxVersion} --preset=apps --interactive=false --name=myorg --nxCloud=false`,
  )
  setCwd(cache.workspaceDir)

  // we have issues with the daemon when running the workspace with local plugin
  // so we turn it off for these workspaces
  if (cache.disableDaemon) {
    log(`Disabling daemon in workspace...`)
    const nxJsonFile = `${cache.workspaceDir}/nx.json`
    const content = fs.readFileSync(nxJsonFile, 'utf8')
    const nxJson = JSON.parse(content)
    nxJson.tasksRunnerOptions.default.options.useDaemonProcess = false
    fs.writeFileSync(nxJsonFile, JSON.stringify(nxJson))

    // stop nx daemon before we run plugin - why?
    log(`Stopping nx daemon...`)
    await runNxCommandAsync(`reset`)
  }

  // we meed this plugin for test suite libs
  await customExec(`npm i @nx/js@${cache.nxVersion} --save-dev`)

  if (!cache.deferPluginInstall) {
    log(`Installing plugin in workspace...`)
    // // these should be installed with the plugin I guess?
    // // if we dont install them here, they'll be found in the parent workspace node_modules
    // await customExec(`npm i @nx/js@${cache.nxVersion} --save-dev`)
    // await customExec(`npm i @nx/devkit@${cache.nxVersion} --save-dev`)
    // await customExec(`npm i @nx/jest@${cache.nxVersion} --save-dev`)
    // install the target plugin we want to test
    await installPlugin(cache)

    // run the plugin initialiser to ensure we have the correct dependencies installed
    log(`Initialising plugin in workspace...`)
    await runNxCommandAsync(`g @simondotm/nx-firebase:init`)
  }

  // if (cache.disableDaemon) {
  // cleanup - stop nx daemon post setup to prevent connection in use errors
  // log(`Stopping nx daemon...`)
  // await runNxCommandAsync('reset')
  // }
}
