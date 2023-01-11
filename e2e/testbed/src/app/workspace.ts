import * as fs from 'fs'
import { log } from './log'
import { customExec, setCwd } from './utils'

export function createTestDir(testDir: string) {
  if (!fs.existsSync(testDir)) {
    log(`Creating test dir '${testDir}'...`)
    fs.mkdirSync(testDir)
  }
  setCwd(testDir)
}

export function cleanWorkspace(dir: string) {
  if (fs.existsSync(dir)) {
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
  await customExec(`npm i @nrwl/js@${nxVersion} --save-dev`)
  // install the target plugin we want to test
  await installPlugin(pluginVersion)
}
