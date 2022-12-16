import {
  joinPathFragments,
  logger,
  readJsonFile,
  writeJsonFile,
} from '@nrwl/devkit'
import { DependentBuildableProjectNode } from '@nrwl/workspace/src/utilities/buildable-libs-utils'
import { FIREBASE_DEPS_DIR } from './copy-dependencies'

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

  if (process.env.NX_VERBOSE_LOGGING) {
    logger.info(`- functions PackageFile '${functionsPackageFile}'`)
  }
  const functionsPackageJson = readJsonFile(functionsPackageFile)
  const functionsPackageDeps = functionsPackageJson.dependencies
  if (functionsPackageDeps) {
    if (process.env.NX_VERBOSE_LOGGING) {
      logger.info(
        '- Updating local dependencies for Firebase functions package.json',
      )
    }
    for (const d in functionsPackageDeps) {
      const localDep = localLibraries[d]
      if (process.env.NX_VERBOSE_LOGGING) {
        logger.info(
          `- Checking dependency '${d}', isLocalDep=${localDep !== undefined}`,
        )
      }
      if (localDep) {
        const localRef = `file:${joinPathFragments(
          '.',
          FIREBASE_DEPS_DIR,
          localDep.node.name,
        )}`
        if (process.env.NX_VERBOSE_LOGGING) {
          logger.info(` - Replacing '${d}' with '${localRef}'`)
        }
        functionsPackageDeps[d] = localRef
      }
    }
  }
  writeJsonFile(functionsPackageFile, functionsPackageJson)
  logger.log('- Updated firebase functions package.json')
  if (process.env.NX_VERBOSE_LOGGING) {
    logger.info(
      `functions package deps = ${JSON.stringify(
        functionsPackageDeps,
        null,
        3,
      )}`,
    )
  }
}
