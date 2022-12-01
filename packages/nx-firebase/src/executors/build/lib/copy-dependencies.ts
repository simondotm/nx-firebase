import { joinPathFragments, logger } from '@nrwl/devkit'
import { DependentBuildableProjectNode } from '@nrwl/workspace/src/utilities/buildable-libs-utils'
import { copy } from 'fs-extra'

export const FIREBASE_DEPS_DIR = 'libs'

export async function copyFirebaseDependencies(
  outputPath: string,
  workspaceRoot: string,
  projectDependencies: DependentBuildableProjectNode[],
) {
  // final custom step for building firebase functions applications is to:
  // - identify any workspace library dependencies
  // - copy them to the application dist folder
  // - update the output "package.json" to use local file references to these libraries
  //
  // This ensures that:
  // - the firebase CLI deploy command will work correctly
  // - all code for the functions is self contained with the dist/app/<firebaseapp> folder
  // - all local code for the functions will be uploaded to GCP without any need to faff with private npm packages

  // copy each of their build outputs in dist to a "libs" sub directory in our application dist output folder
  const localLibraries: Record<string, DependentBuildableProjectNode> = {}
  for (const dep of projectDependencies) {
    const localPackageName = dep.name // the library dependency package name
    const localLibraryName = dep.node.name // the library dependency project name
    localLibraries[localPackageName] = dep
    const srcDir = joinPathFragments(workspaceRoot, dep.outputs[0])
    const outDir = joinPathFragments(
      workspaceRoot,
      outputPath,
      FIREBASE_DEPS_DIR,
      localLibraryName,
    )
    // we also copy libraries to node_modules in dist, because the Firebase CLI also runs the entry point script during a deploy to determine the exported functions
    // however, firebase does NOT upload node_modules to GCP, so we have to make two copies of each dependent local library package
    // see: https://firebase.google.com/docs/functions/handle-dependencies
    // SM: Nov'22, this policy has changed - local libs should NOT be in the `node_modules` folder.
    // https://firebase.google.com/docs/functions/handle-dependencies#including_local_nodejs_modules
    // const nodeModulesDir = joinPathFragments(
    //   workspaceRoot,
    //   outputPath,
    //   'node_modules',
    //   localPackageName,
    // )
    try {
      if (process.env.NX_VERBOSE_LOGGING) {
        logger.info(
          `- Copying dependent workspace library '${dep.node.name}' from '${srcDir}' to '${outDir}'`,
        )
        // logger.info(
        //   `- Copying dependent workspace library '${dep.node.name}' from '${srcDir}' to '${nodeModulesDir}'`,
        // )
      }
      await copy(srcDir, outDir)
      // await copy(srcDir, nodeModulesDir)
      logger.log(` - Copied 'lib' dependency '${dep.name}}'`)
    } catch (err) {
      logger.error(err.message)
    }
  }

  return localLibraries
}
