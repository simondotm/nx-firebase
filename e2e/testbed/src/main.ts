/**
 * Custom e2e test suite for @simondotm/nx-firebase Nx plugin
 * The plugin e2e test suite can be unreliable and has limitations in Jest
 * This script allows us to run full matrix e2e and regression tests of the plugin across:
 * - Node versions 14,16,18
 * - Nx versions against plugin versions
 * - Check firebase deployments in CI environment
 */

import { info, log } from './app/log'
import { addContentToTextFile, runNxCommandAsync } from './app/utils'
import { createTestDir, createWorkspace } from './app/workspace'

const defaultCwd = process.cwd()
console.log(`cwd=${defaultCwd}`)

async function testPlugin(workspaceDir: string) {
  await runNxCommandAsync('g @simondotm/nx-firebase:app functions')
  await runNxCommandAsync(
    'g @nrwl/js:lib lib1 --buildable --importPath="@myorg/lib1"',
  )
  await runNxCommandAsync('build lib1')
  await runNxCommandAsync('build functions')

  // update index.ts so that deps are updated after creation
  const importMatch = `import * as functions from 'firebase-functions';`
  addContentToTextFile(
    `${workspaceDir}/apps/functions/src/index.ts`,
    importMatch,
    '// comment added',
  )
  await runNxCommandAsync('build functions')

  // add a lib dependency
  const importAddition = `import { lib1 } from '@myorg/lib1'\nconsole.log(lib1())\n`
  addContentToTextFile(
    `${workspaceDir}/apps/functions/src/index.ts`,
    importMatch,
    importAddition,
  )
  await runNxCommandAsync('build functions')
}

async function testNxVersion(nxVersion: string, pluginVersion: string) {
  try {
    info(
      '----------------------------------------------------------------------------\n',
    )
    info(
      ` TESTING NX VERSION '${nxVersion}' AGAINST PLUGIN VERSION '${pluginVersion}'\n`,
    )
    info(
      '----------------------------------------------------------------------------\n',
    )

    // setup the target Nx workspace
    const testDir = `${defaultCwd}/tmp/test/${nxVersion}`
    const workspaceDir = `${testDir}/myorg`

    log(
      `Creating new Nx workspace version ${nxVersion} in directory '${testDir}'`,
    )

    createTestDir(testDir)
    await createWorkspace(nxVersion, workspaceDir, pluginVersion)

    // run the plugin test suite
    await testPlugin(workspaceDir)

    info(`VERSION '${nxVersion}' SUCCEEDED\n`)
  } catch (err) {
    info(err.message)
    info(`VERSION '${nxVersion}' FAILED - INCOMPATIBILITY DETECTED\n`)
  }
}

const nxReleases = {
  '15': {
    '4': [0, 1, 2, 3, 4, 5],
    '3': [0, 2, 3],
    '2': [0, 1, 2, 3, 4],
    '1': [0, 1],
    '0': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  '14': {
    '8': [0, 1, 2, 3, 4, 5, 6],
    '7': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18],
    '6': [0, 1, 2, 3, 4, 5],
    '5': [0, 1, 2, 3, 4, 5, 6, 8, 10],
    '4': [0, 1, 2, 3],
    '3': [0, 1, 2, 3, 4, 5, 6],
    '2': [1, 2, 4],
    '1': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    '0': [0, 1, 2, 3, 4, 5],
  },
  '13': {
    '10': [6],
  },
}

async function main() {
  await testNxVersion('13.10.6', '0.3.4')
  //   await testNxVersion('14.8.6', '0.3.4')
  //   await testNxVersion('15.3.3', '0.3.4')
  //   await testNxVersion('15.4.5', '0.3.4')

  // let promises: Promise<void>[] = []
  // // cant run in parallel unless we are ruthless about setting CWD before every command that could be running concurrently
  // const MAX_INSTANCES = 1
  // for (const maj in nxReleases) {
  //   const majVersions = nxReleases[maj]
  //   for (const min in majVersions) {
  //     const patchVersions = majVersions[min]
  //     for (const patch of patchVersions) {
  //       const version = `${maj}.${min}.${patch}`
  //       promises.push(testNxVersion(version, '0.3.4'))
  //       if (promises.length >= MAX_INSTANCES) {
  //         await Promise.all(promises)
  //         promises = []
  //       }
  //     }
  //   }
  // }
  // await Promise.all(promises)
}

main()
