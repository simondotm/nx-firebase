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

export function getDeployTarget(firebaseConfigName: string) {
  return {
    executor: 'nx:run-commands',
    options: {
      command: `firebase deploy --config ${firebaseConfigName}`,
    },
  }
}

export function getConfigTarget(
  projectRoot: string,
  firebaseConfigName: string,
) {
  return {
    executor: 'nx:run-commands',
    options: {
      command: `firebase functions:config:get --config ${firebaseConfigName} > ${projectRoot}/.runtimeconfig.json`,
    },
  }
}

export function getEmulateTarget(firebaseConfigName: string) {
  return {
    executor: 'nx:run-commands',
    options: {
      commands: [
        `npx kill-port --port 9099,5001,8080,9000,5000,8085,9199,9299`,
        `firebase emulators:start --config ${firebaseConfigName}`,
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
  project.targets.deploy = getDeployTarget(options.firebaseConfigName)
  project.targets.getconfig = getConfigTarget(
    project.root,
    options.firebaseConfigName,
  )
  project.targets.emulate = getEmulateTarget(options.firebaseConfigName)
  project.targets.serve = getServeTarget(project)

  updateProjectConfiguration(tree, options.name, project)
}
