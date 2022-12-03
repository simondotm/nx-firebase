import { ExecutorContext, logger, ProjectGraphProjectNode } from '@nrwl/devkit'
import {
  calculateProjectDependencies,
  DependentBuildableProjectNode,
} from '@nrwl/workspace/src/utilities/buildable-libs-utils'

export type FirebaseDependencies = {
  projectDependencies: DependentBuildableProjectNode[]
  npmDependencies: DependentBuildableProjectNode[]
  target: ProjectGraphProjectNode<unknown>
}

export function getFirebaseDependencies(
  context: ExecutorContext,
): FirebaseDependencies {
  logger.log(
    `- Processing dependencies for firebase functions app '${context.projectName}':`,
  )

  const {
    target,
    dependencies,
    nonBuildableDependencies,
    topLevelDependencies,
  } = calculateProjectDependencies(
    context.projectGraph,
    context.root,
    context.projectName,
    context.targetName,
    context.configurationName,
  )

  if (process.env.NX_VERBOSE_LOGGING) {
    logger.info(
      'calculated dependencies=' + JSON.stringify(dependencies, null, 3),
    )
    logger.info('target=' + JSON.stringify(target, null, 3))
    logger.info(
      'nonBuildableDependencies=' +
        JSON.stringify(nonBuildableDependencies, null, 3),
    )
    logger.info(
      'topLevelDependencies=' + JSON.stringify(topLevelDependencies, null, 3),
    )
  }

  // filter dependencies that are nx workspace libraries, sorted alphabetically
  const projectDependencies = dependencies
    .filter((dep: DependentBuildableProjectNode) => {
      return dep.node.type === 'lib'
    })
    .sort(
      (a: DependentBuildableProjectNode, b: DependentBuildableProjectNode) =>
        a.name.localeCompare(b.name),
    )

  // filter npm dependencies, sorted alphabetically
  const npmDependencies = dependencies
    .filter((dep: DependentBuildableProjectNode) => dep.node.type === 'npm')
    .sort(
      (a: DependentBuildableProjectNode, b: DependentBuildableProjectNode) =>
        a.name.localeCompare(b.name),
    )

  // Run dep checks before we compile for:
  // 1) non-buildable libraries
  // 2) nested libraries generated without `--importPath`
  // These are both show-stoppers for successful Firebase functions compilation
  // If any bad dependencies were found, report and throw

  // detect any non-npm compatible nested libraries - eg. @proj/dir/lib
  const incompatibleNestedDependencies: string[] = []
  for (const dep of projectDependencies) {
    const name = dep.name
    if (name.split('/').length > 2) {
      // TODO: check this is platform independent
      incompatibleNestedDependencies.push(name)
    }
  }

  // Non-buildable or nested library dependencies are a show stopper
  // If any bad dependencies were found, report and throw
  if (
    nonBuildableDependencies.length ||
    incompatibleNestedDependencies.length
  ) {
    // Sniff out any dependencies of this application that are
    //  non-buildable libraries
    // These won't show up in `dependencies` because they don't have a `build` target
    //
    // Probably added as user error (done it myself) so better to warn here explicitly
    // than ignore it and allow wierd side-effects to happen if we proceed.
    for (const dep of nonBuildableDependencies) {
      logger.error(
        `ERROR: Found non-buildable library dependency '${dep}' in Firebase Application. Imported libraries must be created with '--buildable'.`,
      )
    }

    for (const dep of incompatibleNestedDependencies) {
      logger.error(
        `ERROR: Found incompatible nested library dependency '${dep}' in Firebase Application. Imported nested libraries must be created with npm compatible '--importPath'.`,
      )
    }
    throw new Error(
      'ERROR: Firebase Application contains references to non-buildable or incompatible nested libraries, please fix in order to proceed with build.',
    )
  }

  for (const d of npmDependencies) {
    const type = d.node.type
    logger.log(` -  Added '${type}' dependency '${d.name}'`)
  }

  return {
    projectDependencies,
    npmDependencies,
    target,
  }
}
