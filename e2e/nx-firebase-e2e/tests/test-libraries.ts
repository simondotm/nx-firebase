import {
  readJson,
  checkFilesExist,
} from '@nx/plugin/testing'

import {
  safeRunNxCommandAsync,
  libGeneratorAsync,
  getProjectData,
} from '../test-utils'

// libraries persist across all e2e tests
export const buildableLibData = getProjectData('libs', 'buildablelib')
export const nonbuildableLibData = getProjectData('libs', 'nonbuildablelib')
export const subDirBuildableLibData = getProjectData('libs', 'buildablelib', {dir: 'subdir'})
export const subDirNonbuildableLibData = getProjectData('libs', 'nonbuildablelib', {dir:'subdir'})

const compileComplete = 'Done compiling TypeScript files for project'
const buildSuccess = 'Successfully ran target build for project'

export function testLibraries() {
  describe('setup libraries', () => {
    it(
      'should create buildable typescript library',
      async () => {
        await libGeneratorAsync(buildableLibData, `--bundler=tsc --importPath="${buildableLibData.npmScope}"`)

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

    it(
      'should create buildable typescript library in subdir',
      async () => {
        await libGeneratorAsync(subDirBuildableLibData, `--bundler=tsc --importPath="${subDirBuildableLibData.npmScope}"`)

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

    it(
      'should create non-buildable typescript library',
      async () => {
        await libGeneratorAsync(nonbuildableLibData, `--bundler=none --importPath="${nonbuildableLibData.npmScope}"`)

        expect(() =>
          checkFilesExist(`${nonbuildableLibData.projectDir}/package.json`),
        ).toThrow()

        const project = readJson(
          `${nonbuildableLibData.projectDir}/project.json`,
        )
        expect(project.targets.build).not.toBeDefined()
    })

    it(
      'should create non-buildable typescript library in subdir',
      async () => {
        // const projectData = getProjectData('libs', 'nonbuildablelib', { dir: 'subdir' })          
        await libGeneratorAsync(subDirNonbuildableLibData, `--bundler=none --importPath="${subDirNonbuildableLibData.npmScope}"`)

        expect(() =>
          checkFilesExist(`${subDirNonbuildableLibData.projectDir}/package.json`),
        ).toThrow()

        const project = readJson(
          `${subDirNonbuildableLibData.projectDir}/project.json`,
        )
        expect(project.targets.build).not.toBeDefined()
    })
  })  
}