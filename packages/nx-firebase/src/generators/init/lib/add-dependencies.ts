import {
  GeneratorCallback,
  readJson,
  Tree,
  addDependenciesToPackageJson,
} from '@nx/devkit'
import { workspaceNxVersion } from '../../../utils'
import {
  //  tsLibVersion,
  firebaseVersion,
  firebaseAdminVersion,
  firebaseFunctionsVersion,
  firebaseToolsVersion,
  firebaseFunctionsTestVersion,
  killportVersion,
} from '../../../utils/versions'

export function addDependencies(tree: Tree): GeneratorCallback {
  const dependencies: Record<string, string> = {}
  const devDependencies: Record<string, string> = {}

  // SM: only add firebase related dependencies if they do not already exist
  // This is atypical for Nx plugins that usually migrate versions automatically
  //  however the nx-firebase plugin is not (currently) opinionated about which version is needed,
  //  so this ensures workspaces retain control over their firebase versions.
  const packageJson = readJson(tree, 'package.json') //readRootPackageJson()

  function addDependencyIfNotPresent(
    packageName: string,
    packageVersion: string,
  ) {
    if (!packageJson.dependencies[packageName]) {
      dependencies[packageName] = packageVersion
    }
  }
  function addDevDependencyIfNotPresent(
    packageName: string,
    packageVersion: string,
  ) {
    if (!packageJson.devDependencies[packageName]) {
      devDependencies[packageName] = packageVersion
    }
  }

  // firebase dependencies
  addDependencyIfNotPresent('firebase', firebaseVersion)
  addDependencyIfNotPresent('firebase-admin', firebaseAdminVersion)
  addDependencyIfNotPresent('firebase-functions', firebaseFunctionsVersion)

  //SM: not convinced we should be adding tslib in this plugin
  //addDependencyIfNotPresent('tslib', tsLibVersion)

  // firebase dev dependencies
  addDevDependencyIfNotPresent('firebase-tools', firebaseToolsVersion)
  addDevDependencyIfNotPresent(
    'firebase-functions-test',
    firebaseFunctionsTestVersion,
  )

  // kill-port is used by the emulate target to ensure clean emulator startup
  // since Nx doesn't kill processes cleanly atm
  addDevDependencyIfNotPresent('kill-port', killportVersion)

  // TODO: find out if Nx devkit adds these versions even if they already exist
  // for now, only add them if they aren't in the workspace already at the same version as the host workspace
  // from:
  // https://github.com/nrwl/nx/blob/5b7dba1cb78cabcf631129b4ce8163406b9c1328/packages/devkit/src/utils/package-json.ts#L84
  //

  // These dependencies are required by the plugin internals, most likely already in the host workspace
  // but add them if not. They are added with the same version that the host workspace is using.
  // This is cleaner than using peerDeps.
  addDevDependencyIfNotPresent('@nx/devkit', workspaceNxVersion.version)

  // used by the plugin function generator as a proxy for creating a typescript app
  addDevDependencyIfNotPresent('@nx/node', workspaceNxVersion.version)
  addDevDependencyIfNotPresent('@nx/eslint', workspaceNxVersion.version)
  addDevDependencyIfNotPresent('@nx/jest', workspaceNxVersion.version)
  addDevDependencyIfNotPresent('@nx/esbuild', workspaceNxVersion.version)
  addDevDependencyIfNotPresent('@nx/js', workspaceNxVersion.version)

  return addDependenciesToPackageJson(tree, dependencies, devDependencies)
}
