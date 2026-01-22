import { readJson, uniq, checkFilesExist, exists, tmpProjPath } from '@nx/plugin/testing'
import { detectPackageManager } from '@nx/devkit'

import {
  ProjectData,
  appGeneratorAsync,
  cleanAppAsync,
  cleanFunctionAsync,
  functionGeneratorAsync,
  getProjectData,
  validateFunctionConfig,
  runTargetAsync,
  expectStrings,
  testDebug,
} from '../test-utils'

// Ensure daemon is disabled for all e2e tests
beforeAll(() => {
  process.env['CI'] = 'true'
  process.env['NX_DAEMON'] = 'false'
})

// Detect package manager in e2e workspace, not main project
const packageManager = detectPackageManager(tmpProjPath())
const packageLockFile =
  packageManager === 'npm'
    ? 'package-lock.json'
    : packageManager === 'pnpm'
    ? 'pnpm-lock.yaml'
    : 'yarn.lock'

function expectedFunctionFiles(projectData: ProjectData) {
  const projectPath = projectData.projectDir
  return [
    `${projectPath}/src/main.ts`,
    `${projectPath}/.eslintrc.json`,
    `${projectPath}/jest.config.ts`,
    `${projectPath}/package.json`,
    `${projectPath}/project.json`,
    `${projectPath}/readme.md`,
    `${projectPath}/tsconfig.app.json`,
    `${projectPath}/tsconfig.json`,
    `${projectPath}/tsconfig.spec.json`,
  ]
}

//--------------------------------------------------------------------------------------------------
// Function generator e2e tests
//--------------------------------------------------------------------------------------------------
describe('nx-firebase function', () => {
  // Track current test's projects for cleanup
  let currentAppData: ProjectData | null = null
  let currentFunctionData: ProjectData | null = null

  // Always run cleanup after each test, even on failure
  afterEach(async () => {
    // Clean up function first (it depends on app)
    if (currentFunctionData) {
      try {
        await cleanFunctionAsync(currentFunctionData)
      } catch (e) {
        testDebug(`Function cleanup warning: ${(e as Error).message}`)
      }
      currentFunctionData = null
    }
    // Then clean up app
    if (currentAppData) {
      try {
        await cleanAppAsync(currentAppData)
      } catch (e) {
        testDebug(`App cleanup warning: ${(e as Error).message}`)
      }
      currentAppData = null
    }
  })

  it('should not create nx-firebase function without --app', async () => {
    const functionData = getProjectData('apps', uniq('firebaseFunction'))
    const result = await functionGeneratorAsync(functionData)
    expect(result.stdout).toContain("Required property 'app' is missing")
    // no cleanup required - function wasn't created
  })

  it('should not create nx-firebase function with an invalid --app', async () => {
    const functionData = getProjectData('apps', uniq('firebaseFunction'))
    const result = await functionGeneratorAsync(functionData, '--app badapple')
    expect(result.stdout).toContain(
      "A firebase application project called 'badapple' was not found in this workspace.",
    )
    // no cleanup required - function wasn't created
  })

  it('should create nx-firebase function', async () => {
    currentAppData = getProjectData('apps', uniq('firebaseApp'))
    currentFunctionData = getProjectData('apps', uniq('firebaseFunction'))

    await appGeneratorAsync(currentAppData)
    await functionGeneratorAsync(
      currentFunctionData,
      `--app ${currentAppData.projectName}`,
    )

    // test generator output
    expect(() =>
      checkFilesExist(...expectedFunctionFiles(currentFunctionData!)),
    ).not.toThrow()

    // check dist files dont exist and we havent accidentally run this test out of sequence
    expect(() =>
      checkFilesExist(
        `dist/${currentFunctionData!.projectDir}/main.js`,
        `dist/${currentFunctionData!.projectDir}/package.json`,
        `dist/${currentFunctionData!.projectDir}/${packageLockFile}`,
        `dist/${currentFunctionData!.projectDir}/.env`,
        `dist/${currentFunctionData!.projectDir}/.env.local`,
        `dist/${currentFunctionData!.projectDir}/.secret.local`,
      ),
    ).toThrow()

    validateFunctionConfig(currentFunctionData, currentAppData)

    // check that google-cloud/functions-framework is added to package.json if pnpm being used
    const packageJson = readJson(`${currentFunctionData.projectDir}/package.json`)
    if (packageManager === 'pnpm') {
      expect(
        packageJson.dependencies['@google-cloud/functions-framework'],
      ).toBeDefined()
    } else {
      expect(
        packageJson.dependencies['@google-cloud/functions-framework'],
      ).not.toBeDefined()
    }
  })

  it('should build nx-firebase function from the app', async () => {
    currentAppData = getProjectData('apps', uniq('firebaseApp'))
    currentFunctionData = getProjectData('apps', uniq('firebaseFunction'))

    await appGeneratorAsync(currentAppData)
    await functionGeneratorAsync(
      currentFunctionData,
      `--app ${currentAppData.projectName}`,
    )

    validateFunctionConfig(currentFunctionData, currentAppData)

    const result = await runTargetAsync(currentAppData, 'build')
    expect(result.stdout).toContain('Build succeeded.')

    expect(() =>
      checkFilesExist(
        `dist/${currentFunctionData!.projectDir}/main.js`,
        `dist/${currentFunctionData!.projectDir}/package.json`,
        `dist/${currentFunctionData!.projectDir}/${packageLockFile}`,
        `dist/${currentFunctionData!.projectDir}/.env`,
        `dist/${currentFunctionData!.projectDir}/.env.local`,
        `dist/${currentFunctionData!.projectDir}/.secret.local`,
      ),
    ).not.toThrow()

    // check that nx preserves the function `package.json` dependencies in the output `package.json`
    const packageJson = readJson(
      `dist/${currentFunctionData.projectDir}/package.json`,
    )
    if (packageManager === 'pnpm') {
      expect(
        packageJson.dependencies['@google-cloud/functions-framework'],
      ).toBeDefined()
    } else {
      expect(
        packageJson.dependencies['@google-cloud/functions-framework'],
      ).not.toBeDefined()
    }
  })

  it('should build nx-firebase function directly', async () => {
    currentAppData = getProjectData('apps', uniq('firebaseApp'))
    currentFunctionData = getProjectData('apps', uniq('firebaseFunction'))

    await appGeneratorAsync(currentAppData)
    await functionGeneratorAsync(
      currentFunctionData,
      `--app ${currentAppData.projectName}`,
    )

    validateFunctionConfig(currentFunctionData, currentAppData)

    const result = await runTargetAsync(currentFunctionData, 'build')
    expect(result.stdout).toContain(
      `nx run ${currentFunctionData.projectName}:build`,
    )
    // esbuild outputs to stderr for some reason
    expect(result.stderr).toContain(`${currentFunctionData.distDir}/main.js`)
    // make sure it hasnt bundled node_modules, indicator is that bundle size is megabytes in size
    expect(result.stderr).not.toContain(`Mb`)
  })

  it('should add correct dependencies to the built function package.json', async () => {
    currentAppData = getProjectData('apps', uniq('firebaseApp'))
    currentFunctionData = getProjectData('apps', uniq('firebaseFunction'))

    await appGeneratorAsync(currentAppData)
    await functionGeneratorAsync(
      currentFunctionData,
      `--app ${currentAppData.projectName}`,
    )

    validateFunctionConfig(currentFunctionData, currentAppData)

    const result = await runTargetAsync(currentFunctionData, 'build')
    expect(result.stdout).toContain(
      `Successfully ran target build for project ${currentFunctionData.projectName}`,
    )

    expectStrings(result.stderr, [`${currentFunctionData.distDir}/main.js`])
    // make sure output build is not megabytes in size, which would mean we've
    // bundled node_modules as well
    expect(result.stdout).not.toContain('Mb')

    const distPackageFile = `${currentFunctionData.distDir}/package.json`
    expect(() => checkFilesExist(distPackageFile)).not.toThrow() 

    const distPackage = readJson(distPackageFile)
    const deps = distPackage['dependencies']
    expect(deps).toBeDefined()
    // firebase-admin is No longer in the default main.ts template
    // expect(deps['firebase-admin']).toBeDefined()
    expect(deps['firebase-functions']).toBeDefined()
  })

  it('should add tags to the function project', async () => {
    currentAppData = getProjectData('apps', uniq('firebaseApp'))
    currentFunctionData = getProjectData('apps', uniq('firebaseFunction'))

    await appGeneratorAsync(currentAppData)
    await functionGeneratorAsync(
      currentFunctionData,
      `--app ${currentAppData.projectName}  --tags e2etag,e2ePackage`,
    )

    validateFunctionConfig(currentFunctionData, currentAppData)

    const project = readJson(`${currentFunctionData.projectDir}/project.json`)
    expect(project.tags).toEqual([
      'firebase:function',
      `firebase:name:${currentFunctionData.projectName}`,
      `firebase:dep:${currentAppData.projectName}`,
      'e2etag',
      'e2ePackage',
    ])
  })
})
