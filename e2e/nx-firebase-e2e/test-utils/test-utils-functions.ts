import type { ProjectData } from './test-utils-project-data'
import { readJson } from '@nx/plugin/testing'

export function expectedFunctionProjectTargets(
  functionProject: ProjectData,
  appProject: ProjectData,
) {
  return {
    build: {
      executor: '@nx/esbuild:esbuild',
      outputs: ['{options.outputPath}'],
      options: {
        platform: 'node',
        outputPath: `dist/${functionProject.projectDir}`,
        main: `${functionProject.projectDir}/src/main.ts`,
        tsConfig: `${functionProject.projectDir}/tsconfig.app.json`,
        assets: [
          `${functionProject.projectDir}/src/assets`,
          {
            glob: '**/*',
            input: `${appProject.projectDir}/environment`,
            output: '.',
          },
        ],
        generatePackageJson: true,
        bundle: true,
        dependenciesFieldType: 'dependencies',
        format: ['esm'],
        thirdParty: false,
        target: 'node20',
        esbuildOptions: {
          logLevel: 'info',
        },
      },
    },
    deploy: {
      executor: 'nx:run-commands',
      options: {
        command: `nx run ${appProject.projectName}:deploy --only functions:${functionProject.projectName}`,
      },
      dependsOn: ['build'],
    },
    lint: {
      executor: '@nx/eslint:lint',
    },
    // Test target is kept with passWithNoTests so functions without tests don't fail
    // with passWithNoTests so functions without tests don't fail
    // Nx 22+ uses jest.config.cts for ESM projects
    test: {
      executor: '@nx/jest:jest',
      outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
      options: {
        jestConfig: expect.stringMatching(
          new RegExp(`^${functionProject.projectDir}/jest\\.config\\.c?ts$`),
        ),
        passWithNoTests: true,
      },
    },
  }
}

export function validateFunctionConfig(
  functionProject: ProjectData,
  appProject: ProjectData,
) {
  const project = readJson(`${functionProject.projectDir}/project.json`)
  // expect(project.root).toEqual(`apps/${projectName}`)
  expect(project.targets).toEqual(
    expect.objectContaining(
      expectedFunctionProjectTargets(functionProject, appProject),
    ),
  )
}
