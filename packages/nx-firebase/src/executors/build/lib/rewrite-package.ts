import {
  joinPathFragments,
  logger,
  readJsonFile,
  writeJsonFile,
} from '@nrwl/devkit'
import { DependentBuildableProjectNode } from '@nrwl/workspace/src/utilities/buildable-libs-utils'
import { debugLog } from './debug'

/**
 * rewrite references to library packages in the functions package.json
 * to be local package references to the copies we made
 * @param outputPath
 * @param localLibraries
 */
export function rewriteFirebasePackage(
  outputPath: string,
  localLibraries: Record<string, DependentBuildableProjectNode>,
) {
  const functionsPackageFile = joinPathFragments(outputPath, 'package.json')

  debugLog('- functions PackageFile=' + functionsPackageFile)
  const functionsPackageJson = readJsonFile(functionsPackageFile)
  const functionsPackageDeps = functionsPackageJson.dependencies
  if (functionsPackageDeps) {
    debugLog(
      '- Updating local dependencies for Firebase functions package.json',
    )
    for (const d in functionsPackageDeps) {
      const localDep = localLibraries[d]
      debugLog(
        "- Checking dependency '" +
          d +
          "', isLocalDep=" +
          (localDep !== undefined),
      )
      if (localDep) {
        const localRef =
          'file:' + joinPathFragments('.', 'libs', localDep.node.name)
        debugLog(" - Replacing '" + d + "' with '" + localRef + "'")
        functionsPackageDeps[d] = localRef
      }
    }
  }
  writeJsonFile(functionsPackageFile, functionsPackageJson)
  logger.log('- Updated firebase functions package.json')
  debugLog(
    'functions package deps = ',
    JSON.stringify(functionsPackageDeps, null, 3),
  )
}
