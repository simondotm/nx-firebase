import {
  GeneratorCallback,
  Tree,
  convertNxGenerator,
  runTasksInSerial,
  addProjectConfiguration,
} from '@nx/devkit'

import { createFiles } from './lib'

import { generateFirebaseConfigName, getProjectName } from '../../utils'
import type { ApplicationGeneratorOptions, NormalizedOptions } from './schema'
import initGenerator from '../init/init'

// how to handle firebase config detection
// when we add an application we can create firebase.json OR firebase.<project>.json if former already exists
// when we add a function, user specifies app project it belongs to, but we dont know firebase config associated with it (plus user can rename without us knowing)
// the simpler the plugin the better
// option - for app creation let user define the config file? for function user must specify config?
// can we determine firebase config from the project file?

// 1. User specifies config, or if undefined
// 2. try firebase.<projectname>.json
// 3. try firebase.json

export function normalizeOptions(
  tree: Tree,
  options: ApplicationGeneratorOptions,
): NormalizedOptions {
  const { projectName, projectRoot } = getProjectName(
    tree,
    options.name,
    options.directory,
  )

  // const firebaseConfigName =
  //   options.firebaseConfig || generateFirebaseConfigName(tree, projectName)

  // plugin convention for firebase.json config is:
  // firebase config will be `firebase.json` for the first firebase app
  // additional apps will use `firebase.<projectname>.json`
  // this makes the config filename deterministic for the plugin
  const firebaseConfigName = generateFirebaseConfigName(tree, projectName)

  // console.log(`firebaseConfigName ${firebaseConfigName}`)
  // firebase config name has to be unique.
  if (tree.exists(firebaseConfigName)) {
    throw Error(
      `There is already a firebase configuration called '${firebaseConfigName}' in this workspace. Please use a different project name.`,
    )
  }

  return {
    ...options,
    projectRoot,
    projectName,
    firebaseConfigName,
  }
}

/**
 * Firebase application generator
 *
 * @param tree
 * @param rawOptions
 * @returns
 */
export async function applicationGenerator(
  tree: Tree,
  rawOptions: ApplicationGeneratorOptions,
): Promise<GeneratorCallback> {
  const options = normalizeOptions(tree, rawOptions)
  const initTask = await initGenerator(tree, {})

  //const dist = `${joinPathFragments('dist', options.projectRoot)}`
  const firebaseProject = options.project ? ` --project=${options.project}` : ''

  // nx watch --projects=${options.projectName} --includeDependentProjects -- nx build ${options.projectName} --clean=false

  addProjectConfiguration(tree, options.projectName, {
    root: options.projectRoot,
    projectType: 'application',
    targets: {
      build: {
        executor: 'nx:run-commands',
        options: {
          command: `echo Build succeeded.`,
        },
      },
      watch: {
        executor: 'nx:run-commands',
        options: {
          command: `nx run-many --targets=build --projects=tag:${options.projectName} --parallel=100 --watch`,
        },
      },
      lint: {
        executor: 'nx:run-commands',
        options: {
          command: `nx run-many --targets=lint --projects=tag:${options.projectName} --parallel=100`,
        },
      },
      test: {
        executor: 'nx:run-commands',
        options: {
          command: `nx run-many --targets=test --projects=tag:${options.projectName} --parallel=100`,
        },
      },
      getconfig: {
        executor: 'nx:run-commands',
        options: {
          command: `firebase functions:config:get${firebaseProject} --config=${options.firebaseConfigName} > ${options.projectRoot}/.runtimeconfig.json`,
        },
      },
      emulate: {
        executor: 'nx:run-commands',
        options: {
          commands: [
            'kill-port --port 9099,5001,8080,9000,5000,8085,9199,9299,4000,4400,4500',
            `firebase emulators:start${firebaseProject} --config=${options.firebaseConfigName} --import=${options.projectRoot}/.emulators --export-on-exit`,
          ],
          parallel: false,
        },
      },
      serve: {
        executor: 'nx:run-commands',
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
          command: `firebase deploy${firebaseProject} --config=${options.firebaseConfigName}`,
        },
        configurations: {
          production: {
            command: `firebase deploy${firebaseProject} --config=${options.firebaseConfigName}`,
          },
        },
      },
    },
    tags: options.tags ? options.tags.split(',').map((s) => s.trim()) : [],
  })

  createFiles(tree, options)

  return runTasksInSerial(initTask)
}

export default applicationGenerator
export const applicationSchematic = convertNxGenerator(applicationGenerator)
