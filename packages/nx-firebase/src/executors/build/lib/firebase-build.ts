import { ExecutorContext } from '@nrwl/devkit'

import { copyFirebaseDependencies } from './copy-dependencies'
import { getFirebaseDependencies } from './get-dependencies'
import { rewriteFirebasePackage } from './rewrite-package'

export async function firebaseBuildExecutor(
  context: ExecutorContext,
  outputPath: string,
) {
  const firebaseDependencies = getFirebaseDependencies(context)
  const localLibraries = await copyFirebaseDependencies(
    outputPath,
    context.root,
    firebaseDependencies.projectDependencies,
  )
  rewriteFirebasePackage(outputPath, localLibraries)
}
