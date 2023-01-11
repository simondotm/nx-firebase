/**
 * Custom e2e test suite for @simondotm/nx-firebase Nx plugin
 * The plugin e2e test suite can be unreliable and has limitations in Jest
 * This script allows us to run full matrix e2e and regression tests of the plugin across:
 * - Node versions 14,16,18
 * - Nx versions against plugin versions
 * - Check firebase deployments in CI environment
 */

import { addContentToTextFile, customExec } from './app/utils'
import { createTestDir, createWorkspace } from './app/workspace'

const defaultCwd = process.cwd()
console.log(`cwd=${defaultCwd}`)

async function testPlugin(workspaceDir: string) {
  await customExec('npx nx g @simondotm/nx-firebase:app functions')
  await customExec(
    'npx nx g @nrwl/js:lib lib1 --buildable --importPath="@myorg/lib1"',
  )
  await customExec('npx nx build lib1')
  await customExec('npx nx build functions')

  // update index.ts so that deps are updated after creation
  const importMatch = `import * as functions from 'firebase-functions';`
  addContentToTextFile(
    `${workspaceDir}/apps/functions/src/index.ts`,
    importMatch,
    '// comment added',
  )
  await customExec('npx nx build functions')

  // add a lib dependency
  const importAddition = `import { lib1 } from '@myorg/lib1'\nconsole.log(lib1())\n`
  addContentToTextFile(
    `${workspaceDir}/apps/functions/src/index.ts`,
    importMatch,
    importAddition,
  )
  await customExec('npx nx build functions')
}

async function testNxVersion(nxVersion: string, pluginVersion: string) {
  console.log(
    '----------------------------------------------------------------------------',
  )
  console.log(
    ` TESTING NX VERSION '${nxVersion}' AGAINST PLUGIN VERSION '${pluginVersion}'`,
  )
  console.log(
    '----------------------------------------------------------------------------',
  )

  // setup the target Nx workspace
  const testDir = `${defaultCwd}/tmp/test/${nxVersion}`
  const workspaceDir = `${testDir}/myorg`

  console.log(
    `Creating new Nx workspace version ${nxVersion} in directory '${testDir}'`,
  )

  createTestDir(testDir)
  await createWorkspace(nxVersion, workspaceDir, pluginVersion)

  // run the plugin test suite
  await testPlugin(workspaceDir)

  console.log('done')
}

async function main() {
  await testNxVersion('13.10.6', '0.3.4')
  await testNxVersion('14.8.6', '0.3.4')
  await testNxVersion('15.3.3', '0.3.4')
}

main()
