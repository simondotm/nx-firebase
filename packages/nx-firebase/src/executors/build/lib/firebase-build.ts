import { ExecutorContext, logger } from '@nrwl/devkit'

import { copyFirebaseDependencies } from './copy-dependencies'
import { getFirebaseDependencies } from './get-dependencies'
import { rewriteFirebasePackage } from './rewrite-package'
import { updateFirebasePackage } from './update-package'

export async function firebaseBuildExecutor(
  context: ExecutorContext,
  outputPath: string,
) {
  const firebaseDependencies = getFirebaseDependencies(context)
  // --updateBuildableProjectDepsInPackageJson is true by default for @nrwl/js:tsc
  // https://nx.dev/packages/js/executors/tsc
  // updateFirebasePackage(context, firebaseDependencies)
  const localLibraries = await copyFirebaseDependencies(
    outputPath,
    context.root,
    firebaseDependencies.projectDependencies,
  )
  rewriteFirebasePackage(outputPath, localLibraries)
}
