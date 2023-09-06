import {
  Tree,
  joinPathFragments,
  logger,
  updateProjectConfiguration,
  writeJson,
} from '@nx/devkit'
import { FirebaseWorkspace } from './types'
import { readFileSync } from 'fs'
import { FirebaseFunction } from '../../../utils'

export function runMigrations(tree: Tree, workspace: FirebaseWorkspace) {
  logger.info(`Running plugin migrations for workspace`)

  // ensure ignores in .gitignore
  // ensure ignores in .nxignore
  // init generator takes care of this

  // [2.0.0 -> 2.1.0] ensure environment files are present in apps
  workspace.firebaseAppProjects.forEach((project, name) => {
    const envPath = `${project.root}/environment`
    const envFiles = [`.env`, `.env.local`, `.secret.local`]
    for (const envFile of envFiles) {
      const fullPath = `${envPath}/${envFile}`
      if (!tree.exists(fullPath)) {
        const src = readFileSync(
          joinPathFragments(
            __dirname,
            '..',
            '..',
            'application',
            'files',
            'environment',
            envFile,
          ),
        )
        tree.write(joinPathFragments(project.root, 'environment', envFile), src)
      }
    }
  })

  // [2.0.0 -> 2.1.0] ensure getconfig path is environment
  workspace.firebaseAppProjects.forEach((project, name) => {
    const getconfig = project.targets['getconfig']
    const command = getconfig?.options.command as string
    if (command) {
      getconfig.options.command = command.replace(
        joinPathFragments(project.root, '.runtimeconfig.json'),
        joinPathFragments(project.root, 'environment', '.runtimeconfig.json'),
      )
      updateProjectConfiguration(tree, project.name, project)
    }
  })

  // [2.0.0 -> 2.1.0] ensure globs in function projects
  workspace.firebaseFunctionProjects.forEach((project, name) => {
    const assets = project.targets['build']?.options.assets as string[]
    const globs = `{ "glob": "**/*", "input": "${project.root}/environment", "output": "."}`
    if (!assets.includes(globs)) {
      assets.push(globs)
      updateProjectConfiguration(tree, project.name, project)
    }
  })

  // [2.0.0 -> 2.1.0] ensure ignores to function firebase.json
  workspace.firebaseConfigs.forEach((config, configFilename) => {
    if (!Array.isArray(config.functions)) {
      // promote to array if single function object
      config.functions = [config.functions as FirebaseFunction]
    }
    config.functions.map((func: FirebaseFunction) => {
      const ignoreRule = '*.local'
      const ignore = func.ignore || [ignoreRule]
      if (!ignore.includes[ignoreRule]) {
        ignore.push(ignoreRule)
      }
    })
    writeJson(tree, configFilename, config)
  })

  // [2.0.0 -> 2.1.0] change firebase serve target
  workspace.firebaseAppProjects.forEach((project, name) => {
    const serve = project.targets['serve']
    const serveExecutor = '@simondotm/nx-firebase:serve'
    if (serve.executor !== serveExecutor) {
      serve.executor = serveExecutor
      updateProjectConfiguration(tree, project.name, project)
    }
  })
}
