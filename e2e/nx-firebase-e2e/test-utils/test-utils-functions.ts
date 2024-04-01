
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
        target: 'node16',
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
      executor: '@nx/linter:eslint',
      outputs: ['{options.outputFile}'],
      options: {
        lintFilePatterns: [`${functionProject.projectDir}/**/*.ts`],
      },
    },
    test: {
      executor: '@nx/jest:jest',
      outputs: [`{workspaceRoot}/coverage/{projectRoot}`],
      options: {
        jestConfig: `${functionProject.projectDir}/jest.config.ts`,
        passWithNoTests: true,
      },
      configurations: {
        ci: {
          ci: true,
          codeCoverage: true,
        },
      },      
    },
  }
}


export function validateFunctionConfig(functionProject: ProjectData, appProject: ProjectData) {
    const project = readJson(
      `${functionProject.projectDir}/project.json`,
    )
    // expect(project.root).toEqual(`apps/${projectName}`)
    expect(project.targets).toEqual(
      expect.objectContaining(expectedFunctionProjectTargets(functionProject, appProject)),
    )
}
