import { GeneratorCallback, readJson, Tree } from '@nrwl/devkit'
import { addDependenciesToPackageJson } from '@nrwl/devkit'
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

  // dependencies
  addDependencyIfNotPresent('firebase', firebaseVersion)
  addDependencyIfNotPresent('firebase-admin', firebaseAdminVersion)
  addDependencyIfNotPresent('firebase-functions', firebaseFunctionsVersion)
  //SM: not convinced we should be adding tslib in this plugin
  //addDependencyIfNotPresent('tslib', tsLibVersion)

  // dev dependencies
  addDevDependencyIfNotPresent('firebase-tools', firebaseToolsVersion)
  addDevDependencyIfNotPresent(
    'firebase-functions-test',
    firebaseFunctionsTestVersion,
  )
  addDevDependencyIfNotPresent('kill-port', killportVersion)

  // TODO: find out if Nx devkit adds these versions even if they already exist
  // for now, only add them if they aren't in the workspace already at the same version as the host workspace
  // from:
  // https://github.com/nrwl/nx/blob/5b7dba1cb78cabcf631129b4ce8163406b9c1328/packages/devkit/src/utils/package-json.ts#L84
  //
  addDevDependencyIfNotPresent('@nrwl/devkit', workspaceNxVersion)
  addDevDependencyIfNotPresent('@nrwl/linter', workspaceNxVersion)
  addDevDependencyIfNotPresent('@nrwl/jest', workspaceNxVersion)
  addDevDependencyIfNotPresent('@nrwl/node', workspaceNxVersion)
  addDevDependencyIfNotPresent('@nrwl/js', workspaceNxVersion)

  return addDependenciesToPackageJson(tree, dependencies, devDependencies)
}
