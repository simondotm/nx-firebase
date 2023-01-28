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

export function getEmulateTarget(
  options: NormalizedOptions,
  project: ProjectConfiguration,
) {
  return {
    executor: 'nx:run-commands',
    options: {
      commands: [
        `node -e 'setTimeout(()=>{},5000)'`,
        `kill-port --port 9099,5001,8080,9000,5000,8085,9199,9299,4000,4400,4500`,
        `firebase functions:config:get ${getFirebaseConfig(
          options,
        )}${getFirebaseProject(options)} > ${joinPathFragments(
          'dist',
          project.root,
        )}/.runtimeconfig.json`,
        `firebase emulators:start ${getFirebaseConfig(
          options,
        )}${getFirebaseProject(options)}`,
      ],
      parallel: false,
    },
  }
}

export function getServeTarget(options: NormalizedOptions) {
  return {
    executor: 'nx:run-commands',
    options: {
      commands: [
        `nx run ${options.projectName}:build --watch`,
        `nx run ${options.projectName}:emulate`,
      ],
    },
  }
}

export function addProject(tree: Tree, options: NormalizedOptions): void {
  const project = readProjectConfiguration(tree, options.projectName)

  project.targets.build = getBuildTarget(project)
  project.targets.deploy = getDeployTarget(options)
  project.targets.getconfig = getConfigTarget(project.root, options)
  project.targets.emulate = getEmulateTarget(options, project)
  project.targets.serve = getServeTarget(options)

  updateProjectConfiguration(tree, options.projectName, project)
}
