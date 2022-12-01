import { ExecutorContext, logger } from '@nrwl/devkit'
import { FirebaseDependencies } from './get-dependencies'
import { updateBuildableProjectPackageJsonDependencies } from '@nrwl/workspace/src/utilities/buildable-libs-utils'

export function updateFirebasePackage(
  context: ExecutorContext,
  firebaseDependencies: FirebaseDependencies,
) {
  // automatically add any dependencies this application has to the output "package.json"
  // this will include both npm imports and workspace library imports
  // non-buildable deps will not show up here, but we've captured them already

  const updateBuildableProjectDepsInPackageJson = true // options.updateBuildableProjectDepsInPackageJson
  const dependencies = [
    ...firebaseDependencies.npmDependencies,
    ...firebaseDependencies.projectDependencies,
  ]
  if (dependencies.length > 0 && updateBuildableProjectDepsInPackageJson) {
    updateBuildableProjectPackageJsonDependencies(
      context.root,
      context.projectName,
      context.targetName,
      context.configurationName,
      firebaseDependencies.target,
      dependencies,
      'dependencies',
    )
  }
}
