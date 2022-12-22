import { joinPathFragments, ProjectConfiguration, Tree } from '@nrwl/devkit'
import {
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nrwl/devkit'
import type { NormalizedOptions } from '../schema'

function getFirebaseProject(options: NormalizedOptions) {
  if (options.project) {
    return ` --project ${options.project}`
  }
  return ''
}

function getFirebaseConfig(options: NormalizedOptions) {
  if (options.firebaseConfigName) {
    return ` --config ${options.firebaseConfigName}`
  }
  return ''
}

export function getBuildTarget(project: ProjectConfiguration) {
  return {
    executor: '@simondotm/nx-firebase:build',
    outputs: ['{options.outputPath}'],
    options: {
      outputPath: joinPathFragments('dist', project.root),
      main: joinPathFragments(project.sourceRoot, 'index.ts'),
      tsConfig: joinPathFragments(project.root, 'tsconfig.app.json'),
      packageJson: joinPathFragments(project.root, 'package.json'),
      assets: [
        joinPathFragments(project.root, '*.md'),
        joinPathFragments(project.root, '.runtimeconfig.json'),
      ],
    },
  }
}

export function getDeployTarget(options: NormalizedOptions) {
  return {
    executor: 'nx:run-commands',
    options: {
      command: `firebase deploy${getFirebaseConfig(
        options,
      )}${getFirebaseProject(options)}`,
    },
  }
}

export function getConfigTarget(
  projectRoot: string,
  options: NormalizedOptions,
) {
  return {
    executor: 'nx:run-commands',
    options: {
      command: `firebase functions:config:get${getFirebaseConfig(
        options,
      )}${getFirebaseProject(options)} > ${projectRoot}/.runtimeconfig.json`,
    },
  }
}

export function getEmulateTarget(options: NormalizedOptions) {
  return {
    executor: 'nx:run-commands',
    options: {
      commands: [
        `npx kill-port --port 9099,5001,8080,9000,5000,8085,9199,9299`,
        `firebase emulators:start ${getFirebaseConfig(
          options,
        )}${getFirebaseProject(options)}`,
      ],
      parallel: false,
    },
  }
}

export function getServeTarget(project: ProjectConfiguration) {
  return {
    executor: 'nx:run-commands',
    options: {
      commands: [
        `nx run ${project.name}:build --watch`,
        `nx run ${project.name}:emulate`,
      ],
    },
  }
}

export function addProject(tree: Tree, options: NormalizedOptions): void {
  const project = readProjectConfiguration(tree, options.projectName)

  project.targets.build = getBuildTarget(project)
  project.targets.deploy = getDeployTarget(options)
  project.targets.getconfig = getConfigTarget(project.root, options)
  project.targets.emulate = getEmulateTarget(options)
  project.targets.serve = getServeTarget(project)

  updateProjectConfiguration(tree, options.name, project)
}
