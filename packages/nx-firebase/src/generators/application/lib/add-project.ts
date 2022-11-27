import { joinPathFragments, ProjectConfiguration, Tree } from '@nrwl/devkit'
import {
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nrwl/devkit'
import type { NormalizedOptions } from '../schema'

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

export function getDeployTarget(project: ProjectConfiguration) {
  return {
    executor: '@nrwl/workspace:run-commands',
    options: {
      command: `firebase deploy --config firebase.${project.name}.json`,
    },
  }
}

export function getConfigTarget(project: ProjectConfiguration) {
  return {
    executor: '@nrwl/workspace:run-commands',
    options: {
      command: `firebase functions:config:get --config firebase.${project.name}.json > ${project.root}/.runtimeconfig.json`,
    },
  }
}

export function getEmulateTarget(project: ProjectConfiguration) {
  return {
    executor: '@nrwl/workspace:run-commands',
    options: {
      command: `firebase emulators:start --config firebase.${project.name}.json`,
    },
  }
}

export function getServeTarget(project: ProjectConfiguration) {
  return {
    executor: '@nrwl/workspace:run-commands',
    options: {
      commands: [
        {
          command: `nx run ${project.name}:build --with-deps && nx run ${project.name}:build --watch`,
        },
        {
          command: `nx run ${project.name}:emulate`,
        },
      ],
      parallel: true,
    },
  }
}

export function addProject(tree: Tree, options: NormalizedOptions): void {
  const project = readProjectConfiguration(tree, options.name)

  project.targets.build = getBuildTarget(project)
  project.targets.deploy = getDeployTarget(project)
  project.targets.getconfig = getConfigTarget(project)
  project.targets.emulate = getEmulateTarget(project)
  project.targets.serve = getServeTarget(project)

  updateProjectConfiguration(tree, options.name, project)
}
