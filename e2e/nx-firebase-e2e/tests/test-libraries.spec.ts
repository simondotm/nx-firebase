import { readJson, checkFilesExist } from '@nx/plugin/testing'
import {
  safeRunNxCommandAsync,
  libGeneratorAsync,
  buildableLibData,
  nonbuildableLibData,
  subDirBuildableLibData,
  subDirNonbuildableLibData,
} from '../test-utils'

// Ensure daemon is disabled for all e2e tests
beforeAll(() => {
  process.env['CI'] = 'true'
  process.env['NX_DAEMON'] = 'false'
})

const compileComplete = 'Done compiling TypeScript files for project'
const buildSuccess = 'Successfully ran target build for project'

//--------------------------------------------------------------------------------------------------
// Create Libraries for e2e function generator tests
// NOTE: This test file creates shared libraries that other tests depend on.
//       It does NOT clean up after itself as other tests use these libraries.
//--------------------------------------------------------------------------------------------------
describe('setup libraries', () => {
  it('should create buildable typescript library', async () => {
    await libGeneratorAsync(
      buildableLibData,
      `--bundler=tsc --importPath="${buildableLibData.npmScope}"`,
    )

    // no need to test the js library generator, only that it ran ok
    expect(() =>
      checkFilesExist(`${buildableLibData.projectDir}/package.json`),
    ).not.toThrow()

    const result = await safeRunNxCommandAsync(
      `build ${buildableLibData.projectName}`,
    )
    expect(result.stdout).toContain(compileComplete)
    expect(result.stdout).toContain(
      `${buildSuccess} ${buildableLibData.projectName}`,
    )
  })

  it('should create buildable typescript library in subdir', async () => {
    await libGeneratorAsync(
      subDirBuildableLibData,
      `--bundler=tsc --importPath="${subDirBuildableLibData.npmScope}"`,
    )

    // no need to test the js library generator, only that it ran ok
    expect(() =>
      checkFilesExist(`${subDirBuildableLibData.projectDir}/package.json`),
    ).not.toThrow()

    const result = await safeRunNxCommandAsync(
      `build ${subDirBuildableLibData.projectName}`,
    )
    expect(result.stdout).toContain(compileComplete)
    expect(result.stdout).toContain(
      `${buildSuccess} ${subDirBuildableLibData.projectName}`,
    )
  })

  it('should create non-buildable typescript library', async () => {
    await libGeneratorAsync(
      nonbuildableLibData,
      `--bundler=none --importPath="${nonbuildableLibData.npmScope}"`,
    )

    expect(() =>
      checkFilesExist(`${nonbuildableLibData.projectDir}/package.json`),
    ).toThrow()

    const project = readJson(`${nonbuildableLibData.projectDir}/project.json`)
    expect(project.targets.build).not.toBeDefined()
  })

  it('should create non-buildable typescript library in subdir', async () => {
    await libGeneratorAsync(
      subDirNonbuildableLibData,
      `--bundler=none --importPath="${subDirNonbuildableLibData.npmScope}"`,
    )

    expect(() =>
      checkFilesExist(`${subDirNonbuildableLibData.projectDir}/package.json`),
    ).toThrow()

    const project = readJson(
      `${subDirNonbuildableLibData.projectDir}/project.json`,
    )
    expect(project.targets.build).not.toBeDefined()
  })
})
