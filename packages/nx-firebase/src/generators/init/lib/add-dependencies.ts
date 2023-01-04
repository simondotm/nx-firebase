import {
  GeneratorCallback,
  logger,
  readJson,
  readRootPackageJson,
  Tree,
} from '@nrwl/devkit'
import { addDependenciesToPackageJson } from '@nrwl/devkit'
import {
  tsLibVersion,
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

  addDependencyIfNotPresent('firebase', firebaseVersion)
  addDependencyIfNotPresent('firebase-admin', firebaseAdminVersion)
  addDependencyIfNotPresent('firebase-functions', firebaseFunctionsVersion)
  addDependencyIfNotPresent('tslib', tsLibVersion)

  addDevDependencyIfNotPresent('firebase-tools', firebaseToolsVersion)
  addDevDependencyIfNotPresent(
    'firebase-functions-test',
    firebaseFunctionsTestVersion,
  )
  addDevDependencyIfNotPresent('kill-port', killportVersion)

  return addDependenciesToPackageJson(tree, dependencies, devDependencies)
}
