import {
  GeneratorCallback,
  Tree,
  convertNxGenerator,
  runTasksInSerial,
  addProjectConfiguration,
  names,
  getWorkspaceLayout,
  formatFiles,
  TargetConfiguration,
} from '@nx/devkit'

import { createFiles } from './lib'

// import { getProjectName } from '../../utils'
import type {
  ApplicationGeneratorSchema,
  ApplicationGeneratorNormalizedSchema,
} from './schema'
import initGenerator from '../init/init'

/**
 *
 * @param tree
 * @param options
 * @returns
 */
function normalizeOptions(
  tree: Tree,
  options: ApplicationGeneratorSchema,
): ApplicationGeneratorNormalizedSchema {
  /**  */
  const name = names(options.name).fileName
  // const projectDirectory = name
  /**
   * By default, we use the name of the firebase application as directory,
   * otherwise concat the directory.
   */
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-')
  const projectRoot = `${getWorkspaceLayout(tree).appsDir}/${projectDirectory}`
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : []

  /**
   * Plugin filename naming convention for firebase.json config is:
   *  firebase config will be `firebase.json` for the first firebase app
   *  additional apps will use `firebase.<projectname>.json`
   *  this makes the config filename deterministic for the plugin
   *
   * - plugin can try `firebase.<projectname>.json` and use if exists
   * - otherwise fallback is `firebase.json`
   */
  const firebaseConfigName = tree.exists('firebase.json')
    ? `firebase.${projectName}.json`
    : 'firebase.json'

  /** firebase config name has to be unique. */
  if (tree.exists(firebaseConfigName)) {
    throw Error(
      `There is already a firebase configuration called '${firebaseConfigName}' in this workspace. Please use a different project name.`,
    )
  }

  /** The Firebase CLI project name. */
  const firebaseCliProject = options.project
    ? ` --project=${options.project}`
    : ''

  return {
    ...options,
    name,
    projectName,
    projectRoot,
    parsedTags,
    firebaseConfigName,
    firebaseCliProject,
  }
}

/**
 *
 * @param options
 * @returns
 */
function generateProjectApplicationTargets(
  options: ApplicationGeneratorNormalizedSchema,
): Record<string, TargetConfiguration> {
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
        command: `nx run-many --targets=build --projects=tag:firebase:dep:${options.projectName} --parallel=100 --watch`,
      },
    },
    lint: {
      executor: 'nx:run-commands',
      options: {
        command: `nx run-many --targets=lint --projects=tag:firebase:dep:${options.projectName} --parallel=100`,
      },
    },
    test: {
      executor: 'nx:run-commands',
      options: {
        command: `nx run-many --targets=test --projects=tag:firebase:dep:${options.projectName} --parallel=100`,
      },
    },
    firebase: {
      executor: 'nx:run-commands',
      options: {
        command: `firebase --config=${options.firebaseConfigName}${options.firebaseCliProject}`,
      },
      configurations: {
        production: {
          command: `firebase --config=${options.firebaseConfigName}${options.firebaseCliProject}`,
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
        command: `nx run ${options.projectName}:firebase functions:config:get > ${options.projectRoot}/environment/.runtimeconfig.json`,
      },
    },
    emulate: {
      executor: 'nx:run-commands',
      options: {
        commands: [
          `nx run ${options.projectName}:killports`,
          `nx run ${options.projectName}:firebase emulators:start --import=${options.projectRoot}/.emulators --export-on-exit`,
        ],
        parallel: false,
      },
    },
    serve: {
      executor: '@simondotm/nx-firebase:serve',
      options: {
        commands: [
          `nx run ${options.projectName}:watch`,
          `nx run ${options.projectName}:emulate`,
        ],
      },
    },
    deploy: {
      executor: 'nx:run-commands',
      dependsOn: ['build'],
      options: {
        command: `nx run ${options.projectName}:firebase deploy`,
      },
    },
  }
}

/**
 *
 * @param tree
 * @param options
 * @returns
 */
export async function applicationGenerator(
  tree: Tree,
  options: ApplicationGeneratorSchema,
): Promise<GeneratorCallback> {
  const normalizedOptions = normalizeOptions(tree, options)

  /** Execute the `init` generator before adding the project configuration. */
  const initTask: GeneratorCallback = await initGenerator(tree, {})

  /** */
  addProjectConfiguration(tree, normalizedOptions.name, {
    root: normalizedOptions.projectRoot,
    projectType: 'application',
    sourceRoot: `${normalizedOptions.projectRoot}/src`,
    targets: generateProjectApplicationTargets(normalizedOptions),
    tags: [
      `firebase:app`,
      `firebase:name:${normalizedOptions.projectName}`,
      ...normalizedOptions.parsedTags,
    ],
  })

  /** Generate the firebase app specific files. */
  createFiles(tree, normalizedOptions)

  /** Auto-format files using nx-devkit */
  await formatFiles(tree)

  return runTasksInSerial(initTask)
}

export default applicationGenerator
export const applicationSchematic = convertNxGenerator(applicationGenerator)
