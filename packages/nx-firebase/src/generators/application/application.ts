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

export function normalizeOptions(
  tree: Tree,
  options: ApplicationGeneratorOptions,
): NormalizedOptions {
  const { projectName, projectRoot } = getProjectName(
    tree,
    options.name,
    options.directory,
  )

  /**
   * Plugin filename naming convention for firebase.json config is:
   *  firebase config will be `firebase.json` for the first firebase app
   *  additional apps will use `firebase.<projectname>.json`
   *  this makes the config filename deterministic for the plugin
   *
   * - plugin can try `firebase.<projectname>.json` and use if exists
   * - otherwise fallback is `firebase.json`
   */
  const firebaseConfigName = generateFirebaseConfigName(tree, projectName)

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

  const firebaseCliProject = options.project
    ? ` --project=${options.project}`
    : ''

  const tags = [`firebase:app`, `firebase:name:${options.projectName}`]
  if (options.tags) {
    options.tags.split(',').map((s) => {
      s.trim()
      tags.push(s)
    })
  }

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
          command: `firebase --config=${options.firebaseConfigName}${firebaseCliProject}`,
        },
        configurations: {
          production: {
            command: `firebase --config=${options.firebaseConfigName}${firebaseCliProject}`,
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
          command: `nx run ${options.projectName}:firebase functions:config:get > ${options.projectRoot}/.runtimeconfig.json`,
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
          command: `nx run ${options.projectName}:firebase deploy`,
        },
      },
    },
    tags,
  })

  createFiles(tree, options)

  return runTasksInSerial(initTask)
}

export default applicationGenerator
export const applicationSchematic = convertNxGenerator(applicationGenerator)
