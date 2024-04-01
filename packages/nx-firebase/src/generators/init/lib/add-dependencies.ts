import {
  GeneratorCallback,
  readJson,
  Tree,
  addDependenciesToPackageJson,
} from '@nx/devkit'
import { workspaceNxVersion } from '../../../utils'
import { packageVersions } from '../../../__generated__/nx-firebase-versions'

export function addDependencies(tree: Tree): GeneratorCallback {
  const dependencies: Record<string, string> = {}
  const devDependencies: Record<string, string> = {}

  // SM: only add firebase related dependencies if they do not already exist
  // This is atypical for Nx plugins that usually migrate versions automatically
  //  however the nx-firebase plugin is not (currently) opinionated about which version is needed,
  //  so this ensures workspaces retain control over their firebase versions.
  const packageJson = readJson(tree, 'package.json')

  function addDependencyIfNotPresent(
    packageName: string,
    packageVersion: string,
  ) {
    if (!packageJson.dependencies || !packageJson.dependencies[packageName]) {
      dependencies[packageName] = packageVersion
    }
  }
  function addDevDependencyIfNotPresent(
    packageName: string,
    packageVersion: string,
  ) {
    if (
      !packageJson.devDependencies ||
      !packageJson.devDependencies[packageName]
    ) {
      devDependencies[packageName] = packageVersion
    }
  }

  // Firebase packages are not managed by the plugin
  // but they are added if they do not exist already in the workspace
  addDependencyIfNotPresent('firebase', `^${packageVersions.firebase}`)
  addDependencyIfNotPresent(
    'firebase-admin',
    `^${packageVersions.firebaseAdmin}`,
  )
  addDependencyIfNotPresent(
    'firebase-functions',
    `^${packageVersions.firebaseFunctions}`,
  )

  //SM: not convinced we should be adding tslib in this plugin
  //addDependencyIfNotPresent('tslib', tsLibVersion)

  // firebase dev dependencies
  addDevDependencyIfNotPresent(
    'firebase-tools',
    `^${packageVersions.firebaseTools}`,
  )
  addDevDependencyIfNotPresent(
    'firebase-functions-test',
    `^${packageVersions.firebaseFunctionsTest}`,
  )

  // kill-port is used by the emulate target to ensure clean emulator startup
  // since Nx doesn't kill processes cleanly atm
  addDevDependencyIfNotPresent('kill-port', `^${packageVersions.killPort}`)

  // @nx/node is used by the plugin function generator as a proxy for creating a typescript app
  // since users have to create a firebase app before they generate a function, we can be sure
  // this plugin init will have been run before the function generator that requires @nx/node is used
  // we defer to @nx/node to install its own plugins such as @nx/eslint, @nx/jest, @nx/js, @nx/esbuild, @nx/webpack etc.
  addDevDependencyIfNotPresent('@nx/node', workspaceNxVersion.version)
  return addDependenciesToPackageJson(tree, dependencies, devDependencies)
}
