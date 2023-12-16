import { names } from '@nx/devkit'
import { readJson, runNxCommandAsync } from '@nx/plugin/testing'

const NPM_SCOPE = '@proj'

export interface ProjectData {
  name: string
  dir?: string
  projectName: string
  projectDir: string
  srcDir: string
  distDir: string
  mainTsPath: string
  npmScope: string
  configName: string
}

const ENABLE_TEST_DEBUG_INFO = true
const STRIP_ANSI_MATCHER =
  /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g

export function testDebug(info: string) {
  if (ENABLE_TEST_DEBUG_INFO) {
    console.debug(info)
  }
}

export async function safeRunNxCommandAsync(cmd: string) {
  try {
    const result = await runNxCommandAsync(`${cmd} --verbose`, {
      silenceError: true,
    })
    // strip chalk TTY ANSI codes from output
    result.stdout = result.stdout.replace(STRIP_ANSI_MATCHER, '')
    result.stderr = result.stderr.replace(STRIP_ANSI_MATCHER, '')
    return result
  } catch (e) {
    throw e
  }
}

export async function runTargetAsync(
  projectData: ProjectData,
  target: string = 'build',
) {
  if (target === 'build') {
    // need to reset Nx here for e2e test to work
    // otherwise it bundles node modules in the main.js output too
    // I think this is a problem with dep-graph, since it works if main.ts
    // is modified before first build
    await runNxCommandAsync('reset')
  }

  const result = await safeRunNxCommandAsync(
    `${target} ${projectData.projectName}`,
  )
  testDebug(`- runTargetAsync ${target} ${projectData.projectName}`)
  testDebug(result.stdout)
  testDebug(result.stderr)

  if (target === 'build') {
    expectStrings(result.stdout, [
      `Successfully ran target ${target} for project ${projectData.projectName}`,
    ])
  }

  return result
}

export async function removeProjectAsync(projectData: ProjectData) {
  const result = await safeRunNxCommandAsync(
    `g @nx/workspace:remove ${projectData.projectName} --forceRemove`,
  )
  expectStrings(result.stdout, [
    `DELETE ${projectData.projectDir}/project.json`,
    `DELETE ${projectData.projectDir}`,
  ])
  return result
}

export async function renameProjectAsync(
  projectData: ProjectData,
  renameProjectData: ProjectData,
) {
  //TODO: this wont work if destination project is in a subdir
  const result = await safeRunNxCommandAsync(
    `g @nx/workspace:move --project=${projectData.projectName} --destination=${renameProjectData.projectName}`,
  )
  expectStrings(result.stdout, [
    `DELETE apps/${projectData.projectName}/project.json`,
    `DELETE apps/${projectData.projectName}`,
    `CREATE apps/${renameProjectData.projectName}/project.json`,
  ])
  return result
}

export async function appGeneratorAsync(
  projectData: ProjectData,
  params: string = '',
) {
  const result = await safeRunNxCommandAsync(
    `g @simondotm/nx-firebase:app ${projectData.name} ${params}`,
  )
  testDebug(`- appGeneratorAsync ${projectData.projectName}`)
  testDebug(result.stdout)

  return result
}

export async function functionGeneratorAsync(
  projectData: ProjectData,
  params: string = '',
) {
  const result = await safeRunNxCommandAsync(
    `g @simondotm/nx-firebase:function ${projectData.name} ${params}`,
  )
  testDebug(`- functionGeneratorAsync ${projectData.projectName}`)
  testDebug(result.stdout)
  testDebug(result.stderr)
  return result
}

export async function syncGeneratorAsync(params: string = '') {
  return await safeRunNxCommandAsync(`g @simondotm/nx-firebase:sync ${params}`)
}

export async function migrateGeneratorAsync(params: string = '') {
  return await safeRunNxCommandAsync(
    `g @simondotm/nx-firebase:migrate ${params}`,
  )
}

export async function libGeneratorAsync(
  projectData: ProjectData,
  params: string = '',
) {
  return await safeRunNxCommandAsync(
    `g @nx/js:lib ${projectData.name} ${params}`,
  )
}

export async function cleanAppAsync(
  projectData: ProjectData,
  options = { appsRemaining: 0, functionsRemaining: 0 },
) {
  testDebug(`- cleanAppAsync ${projectData.projectName}`)
  await removeProjectAsync(projectData)
  const result = await syncGeneratorAsync(projectData.projectName)
  testDebug(result.stdout)
  expect(result.stdout).toMatch(/DELETE (firebase)(\S*)(.json)/)
  expectStrings(result.stdout, [
    `This workspace has ${options.appsRemaining} firebase apps and ${options.functionsRemaining} firebase functions`,
    `CHANGE Firebase config '${projectData.configName}' is no longer referenced by any firebase app, deleted`,
  ])
}

export async function cleanFunctionAsync(projectData: ProjectData) {
  testDebug(`- cleanFunctionAsync ${projectData.projectName}`)
  await removeProjectAsync(projectData)
}

export function expectStrings(input: string, contains: string[]) {
  contains.forEach((item) => {
    expect(input).toContain(item)
  })
}

export function expectNoStrings(input: string, contains: string[]) {
  contains.forEach((item) => {
    expect(input).not.toContain(item)
  })
}

/**
 * Generate test project data
 * Note: call this function AFTER initial app firebase.json has been created in order to have a
 *  correct configName
 * @param name - project name (cannot be camel case)
 * @param dir - project dir
 * @returns - asset locations for this project
 */
export function getProjectData(
  type: 'libs' | 'apps',
  name: string,
  options?: { dir?: string; customConfig?: boolean },
): ProjectData {
  const d = options?.dir ? `${names(options.dir).fileName}` : ''
  const n = names(name).fileName

  const prefix = options?.dir ? `${d}-` : ''
  const projectName = `${prefix}${n}`
  const rootDir = options?.dir ? `${d}/` : ''
  const distDir = `dist/${type}/${rootDir}${n}`
  return {
    name, // name passed to generator
    dir: options?.dir, // directory passed to generator
    projectName, // project name
    projectDir: `${type}/${rootDir}${n}`,
    srcDir: `${type}/${rootDir}${n}/src`,
    distDir: distDir,
    mainTsPath: `${type}/${rootDir}${n}/src/main.ts`,
    npmScope: `${NPM_SCOPE}/${projectName}`,
    configName: options?.customConfig
      ? `firebase.${projectName}.json`
      : 'firebase.json',
  }
}

const IMPORT_MATCH = `import * as logger from "firebase-functions/logger";`

export function getMainTs() {
  return `
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
${IMPORT_MATCH}

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});
`
}

/**
 * return the import function for a generated library
 */
export function getLibImport(projectData: ProjectData) {
  const libName = projectData.name
  const libDir = projectData.dir
  return libDir
    ? `${libDir}${libName[0].toUpperCase() + libName.substring(1)}`
    : libName
}

export function addImport(mainTs: string, addition: string) {
  const replaced = mainTs.replace(IMPORT_MATCH, `${IMPORT_MATCH}\n${addition}`)
  return replaced
}

export function expectedAppProjectTargets(appProject: ProjectData) {
  return {
    build: {
      executor: 'nx:run-commands',
      options: {
        command: `echo Build succeeded.`,
      },
    },
    watch: {
      executor: 'nx:run-commands',
      options: {
        command: `nx run-many --targets=build --projects=tag:firebase:dep:${appProject.projectName} --parallel=100 --watch`,
      },
    },
    lint: {
      executor: 'nx:run-commands',
      options: {
        command: `nx run-many --targets=lint --projects=tag:firebase:dep:${appProject.projectName} --parallel=100`,
      },
    },
    test: {
      executor: 'nx:run-commands',
      options: {
        command: `nx run-many --targets=test --projects=tag:firebase:dep:${appProject.projectName} --parallel=100`,
      },
    },
    firebase: {
      executor: 'nx:run-commands',
      options: {
        command: `firebase --config=firebase.json`,
      },
      configurations: {
        production: {
          command: `firebase --config=firebase.json`,
        },
      },
    },
    killports: {
      executor: 'nx:run-commands',
      options: {
        command: `kill-port --port 9099,5001,8080,9000,5000,8085,9199,9299,4000,4400,4500`,
      },
    },
    getconfig: {
      executor: 'nx:run-commands',
      options: {
        command: `nx run ${appProject.projectName}:firebase functions:config:get > ${appProject.projectDir}/environment/.runtimeconfig.json`,
      },
    },
    emulate: {
      executor: 'nx:run-commands',
      options: {
        commands: [
          `nx run ${appProject.projectName}:killports`,
          `nx run ${appProject.projectName}:firebase emulators:start --import=${appProject.projectDir}/.emulators --export-on-exit`,
        ],
        parallel: false,
      },
    },
    serve: {
      executor: '@simondotm/nx-firebase:serve',
      options: {
        commands: [
          `nx run ${appProject.projectName}:watch`,
          `nx run ${appProject.projectName}:emulate`,
        ],
      },
    },
    deploy: {
      executor: 'nx:run-commands',
      dependsOn: ['build'],
      options: {
        command: `nx run ${appProject.projectName}:firebase deploy`,
      },
    },
  }
}

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
      executor: '@nx/eslint:eslint',
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

export function validateProjectConfig(appProject: ProjectData) {
  const project = readJson(`${appProject.projectDir}/project.json`)
  // expect(project.root).toEqual(`apps/${projectName}`)
  expect(project.targets).toEqual(
    expect.objectContaining(expectedAppProjectTargets(appProject)),
  )
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
