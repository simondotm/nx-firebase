import * as fs from 'fs'
import { customExec } from './utils/exec'
import { log } from './utils/log'
import { setCwd } from './utils/utils'

export function createTestDir(testDir: string) {
  if (!fs.existsSync(testDir)) {
    log(`Creating test dir '${testDir}'...`)
    fs.mkdirSync(testDir)
  }
  setCwd(testDir)
}

export function workspaceExists(workspaceDir: string) {
  return fs.existsSync(workspaceDir)
}

export function cleanWorkspace(dir: string) {
  if (workspaceExists(dir)) {
    log(`Cleaning workspace '${dir}'...`)
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

export async function installPlugin(pluginVersion: string) {
  await customExec(`npm i @simondotm/nx-firebase@${pluginVersion} --save-dev`)
}

export async function createWorkspace(
  nxVersion: string,
  workspaceDir: string,
  pluginVersion: string,
) {
  cleanWorkspace(workspaceDir)
  await customExec(
    `npx create-nx-workspace@${nxVersion} --preset=apps --interactive=false --name=myorg --nxCloud=false`,
  )
  setCwd(workspaceDir)

  // these should be installed with the plugin I guess?
  // if we dont install them here, they'll be found in the parent workspace node_modules
  await customExec(`npm i @nrwl/js@${nxVersion} --save-dev`)
  await customExec(`npm i @nrwl/devkit@${nxVersion} --save-dev`)
  await customExec(`npm i @nrwl/jest@${nxVersion} --save-dev`)
  // install the target plugin we want to test
  await installPlugin(pluginVersion)
}
