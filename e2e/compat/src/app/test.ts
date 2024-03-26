import { get } from 'http'
import { Cache, getCache, isNxVersionSince } from './utils/cache'
import { customExec, runNxCommandAsync } from './utils/exec'
import { expectToContain, expectToNotContain, it } from './utils/jest-ish'
import { green, info, log, red, setLogFile, time } from './utils/log'
import {
  addContentToTextFile,
  deleteDir,
  getFileSize,
  setCwd,
} from './utils/utils'
import { installPlugin } from './workspace'

const npmContent = [
  `Added 'npm' dependency 'firebase-admin'`,
  `Added 'npm' dependency 'firebase-functions'`,
]

const libContent = [`Copied 'lib' dependency '@myorg/lib1'`]

const importMatch = `import * as functions from "firebase-functions";`

const notCachedMatch = `[existing outputs match the cache, left as is]`

const DELETE_AFTER_TEST = false

/**
 * A basic e2e test suite for the plugin to check compatibility with different Nx versions
 * We just want to check that the plugin can generate and build firebase apps and functions in each nx workspace version
 * @param cache
 */
export async function testPlugin(cache: Cache) {
  const workspaceDir = cache.workspaceDir
  const indexTsPath = `${workspaceDir}/apps/functions/src/index.ts`

  // from nx 16.8.0, apps and libs dirs need to be specified in the commandline
  let appsDirectory = ''
  let libsDirectory = ''
  if (isNxVersionSince(cache, '16.8.0')) {
    appsDirectory = '--directory=apps'
    libsDirectory = '--directory=libs'
  }

  // the function generator imports @nx/node, which is only installed to the workspace if the app is generated first
  // so this test checks that the workspace is setup correctly
  await it('should throw if function is generated before app', async () => {
    let failed = false
    try {
      await runNxCommandAsync(
        `g @simondotm/nx-firebase:func functions ${appsDirectory} --app=firebase`,
      )
    } catch (err) {
      failed = true
    }

    expectToContain(failed ? 'failed' : 'succeeded', 'failed')
  })

  // generate a test firebase app
  await runNxCommandAsync(
    `g @simondotm/nx-firebase:app firebase ${appsDirectory}`,
  )
  // generate a test firebase function
  await runNxCommandAsync(
    `g @simondotm/nx-firebase:func functions ${appsDirectory} --app=firebase`,
  )
  // generate a test js library
  await runNxCommandAsync(
    `g @nx/js:lib lib1 ${libsDirectory} --importPath="@myorg/lib1"`,
  )

  // await it('should build the lib', async () => {
  //   await runNxCommandAsync('build lib1')
  // })

  // build the firebase app
  await it('should build the firebase app', async () => {
    const { stdout } = await runNxCommandAsync('build firebase')
    // expectToNotContain(stdout, npmContent)
    // expectToNotContain(stdout, libContent)
  })

  // build the firebase functions
  await it('should build the functions app', async () => {
    const { stdout } = await runNxCommandAsync('build functions')
    log(stdout)
  })

  // check that sync runs
  await it('should sync the workspace', async () => {
    const { stdout } = await runNxCommandAsync('g @simondotm/nx-firebase:sync')
    expectToContain(
      stdout,
      `This workspace has 1 firebase apps and 1 firebase functions`,
    )
    log(stdout)
  })

  // await it('should update index.ts so that deps are updated after creation', async () => {
  //   addContentToTextFile(indexTsPath, importMatch, '// comment added')
  //   const { stdout } = await runNxCommandAsync('build functions')
  //   expectToContain(stdout, npmContent)
  //   expectToNotContain(stdout, libContent)
  // })

  // await it('should add a lib dependency', async () => {
  //   const importAddition = `import { lib1 } from '@myorg/lib1'\nconsole.log(lib1())\n`
  //   addContentToTextFile(indexTsPath, importMatch, importAddition)
  //   const { stdout } = await runNxCommandAsync('build functions')
  //   expectToContain(stdout, npmContent)
  //   expectToContain(stdout, libContent)
  // })

  // some early 16.x versions of nx seem to have a flaky esbuild implementation
  // that intermittently fails to exclude external deps from the bundle
  // we check for this by testing the bundle size is not >1kb
  await it('should not bundle external deps', async () => {
    const fileSize = getFileSize(`${workspaceDir}/dist/apps/functions/main.js`)
    if (fileSize > 1024)
      throw new Error(
        `TEST FAILED: esbuild bundle size is >1kb (${fileSize / 1024}kb)`,
      )
  })

  // TODO: other checks
  // - check package.json contains the deps
  // - check package.json has the right node engine
  // - check all the files exist
  // - check the firebase config looks legit
  // - if possible, run a test deploy?
  // - check the init generator installs the firebase deps
  // - check the plugin peerdeps installs the @nx/js and @nx/devkit and @nx/node deps
}

export function clean() {
  const cache = getCache('', '')
  info(red(`Cleaning compat test cache dir '${cache.rootDir}'`))
  deleteDir(cache.rootDir)
}

export async function testNxVersion(cache: Cache) {
  let error: string | undefined

  const t = Date.now()

  setLogFile(`${cache.rootDir}/${cache.nxVersion}.e2e.txt`)

  try {
    info(
      `TESTING NX VERSION '${cache.nxVersion}' AGAINST PLUGIN VERSION '${cache.pluginVersion}'\n`,
    )

    // cleanup
    setCwd(cache.rootDir)
    deleteDir(cache.testDir)

    // unpack the archive
    setCwd(cache.rootDir)
    await customExec(`tar -xzf ${cache.archiveFile}`) // add -v for verbose

    setCwd(cache.workspaceDir)

    if (cache.deferPluginInstall) {
      // lets see if installing the plugin in the test suite
      // makes things more stable...
      await installPlugin(cache)
    }

    // run the plugin test suite
    await testPlugin(cache)

    info(green(`TESTING VERSION '${cache.nxVersion}' SUCCEEDED\n`))
  } catch (err) {
    info(err.message)
    info(
      red(
        `TESTING VERSION '${cache.nxVersion}' FAILED - INCOMPATIBILITY DETECTED\n`,
      ),
    )
    error = err.message
  }

  // pretty sure there's nothing but trouble doing this
  // if (cache.disableDaemon) {
  // stop nx daemon after the test to stop connection in use errors
  // await runNxCommandAsync(`reset`)
  // }

  // cleanup
  setCwd(cache.rootDir)

  if (DELETE_AFTER_TEST) {
    deleteDir(cache.testDir)
  }

  const dt = Date.now() - t
  info(`Completed in ${time(dt)}\n`)

  return error
}
