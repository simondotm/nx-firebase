import {
  GeneratorCallback,
  logger,
  runTasksInSerial,
  Tree,
  joinPathFragments,
  updateProjectConfiguration,
  writeJson,
} from '@nx/devkit'
import { MigrateGeneratorSchema } from './schema'
import initGenerator from '../init/init'
import {
  debugInfo,
  getFirebaseScopeFromTag,
  getFirebaseWorkspace,
} from '../sync/lib'
import { readFileSync } from 'fs'
import { FunctionAssetsEntry, FirebaseFunction } from '../../types'

/**
 * Migrate firebase workspace
 *
 */
export default async function migrateGenerator(
  tree: Tree,
  // eslint-disable-next-line
  options: MigrateGeneratorSchema,
): Promise<GeneratorCallback> {
  const tasks: GeneratorCallback[] = []

  // initialise plugin
  const initTask = await initGenerator(tree, {})
  tasks.push(initTask)

  // otherwise, sync the workspace.
  // build lists of firebase apps & functions that have been deleted or renamed
  debugInfo('- Migrating workspace')

  const workspace = getFirebaseWorkspace(tree)

  logger.info(
    `This workspace has ${workspace.firebaseAppProjects.size} firebase apps and ${workspace.firebaseFunctionProjects.size} firebase functions\n\n`,
  )

  logger.info(`Running plugin migrations for workspace`)

  // ensure ignores in .gitignore
  // ensure ignores in .nxignore
  // init generator takes care of this

  // [2.0.0 -> 2.1.0] ensure environment files are present in apps dir
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
            'application',
            'files',
            'environment',
            envFile,
          ),
        )
        tree.write(joinPathFragments(project.root, 'environment', envFile), src)
        logger.info(
          `MIGRATE Added default environment file 'environment/${envFile}' for firebase app '${name}'`,
        )
      }
    }
  })

  // [2.0.0 -> 2.1.0] ensure getconfig path is environment
  workspace.firebaseAppProjects.forEach((project, name) => {
    const getconfig = project.targets['getconfig']
    const command = getconfig?.options.command as string
    const legacyPath = joinPathFragments(project.root, '.runtimeconfig.json')
    if (command.includes(legacyPath)) {
      getconfig.options.command = command.replace(
        legacyPath,
        joinPathFragments(project.root, 'environment', '.runtimeconfig.json'),
      )
      logger.info(
        `MIGRATE Updated getconfig target to use ignore environment directory for firebase app '${name}'`,
      )

      updateProjectConfiguration(tree, project.name, project)
    }
  })

  // [2.0.0 -> 2.1.0] ensure globs in function projects
  workspace.firebaseFunctionProjects.forEach((project, name) => {
    const appName = getFirebaseScopeFromTag(project, 'firebase:dep')
    const appProject = workspace.firebaseAppProjects.get(appName.tagValue)
    const assets = project.targets['build']?.options
      .assets as FunctionAssetsEntry[]
    const globs = {
      glob: '**/*',
      input: `${appProject.root}/environment`, // TODO: must be path of parent firebase app
      output: '.',
    }

    let hasAssetsGlob = false
    assets.forEach((asset) => {
      if (typeof asset === 'object') {
        if (
          asset.glob === globs.glob &&
          asset.input === globs.input &&
          asset.output === globs.output
        ) {
          hasAssetsGlob = true
        }
      }
    })
    if (!hasAssetsGlob) {
      assets.push(globs)
      logger.info(
        `MIGRATE Added assets glob for firebase function app '${name}'`,
      )
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
      const ignore = func.ignore || []
      if (!ignore.includes(ignoreRule)) {
        logger.info(
          `MIGRATE Added ignore rule to firebase config '${configFilename}' for firebase function codebase '${func.codebase}'`,
        )
        ignore.push(ignoreRule)
      }
      func.ignore = ignore
    })
    writeJson(tree, configFilename, config)
  })

  // [2.0.0 -> 2.1.0] change firebase serve target
  workspace.firebaseAppProjects.forEach((project, name) => {
    const serve = project.targets['serve']
    const serveExecutor = '@simondotm/nx-firebase:serve'
    if (serve.executor !== serveExecutor) {
      serve.executor = serveExecutor
      logger.info(`MIGRATE Updated serve target for firebase app '${name}'`)

      updateProjectConfiguration(tree, project.name, project)
    }
  })

  return runTasksInSerial(...tasks)
}
