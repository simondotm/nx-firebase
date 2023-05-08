import {
  // createProjectGraphAsync,
  ExecutorContext,
  logger,
  ProjectGraphProjectNode,
  // readCachedProjectGraph,
} from '@nx/devkit'
import {
  calculateProjectDependencies,
  DependentBuildableProjectNode,
} from '@nx/js/src/utils/buildable-libs-utils'

export type FirebaseDependencies = {
  projectDependencies: DependentBuildableProjectNode[]
  npmDependencies: DependentBuildableProjectNode[]
  target: ProjectGraphProjectNode
}

export async function getFirebaseDependencies(
  context: ExecutorContext,
): Promise<FirebaseDependencies> {
  logger.log(
    `- Processing dependencies for firebase functions app '${context.projectName}':`,
  )

  // NX 14/15 ONLY
  // createProjectGraphAsync for Nx13 does not work with newer versions of Nx workspaces due to `root` field no longer being in the `project.json` files
  // See https://github.com/e-square-io/nx-github-actions/issues/53
  // This means our Nx 13 version of the plugin cannot support project graph changes
  // SM: recompute the project graph on every iteration so that --watch will work,
  //  since the context.projectGraph is only a snapshot of dependencies at the time the plugin was run
  // seems like 14.1.10 is when this started being compatible.

  // SM: update, cant see why this would be true if we're using the same Nx devkit version as the Nx workspace
  // NX 13.x file - https://github.com/nrwl/nx/blob/1b0092c69f64e77abd5fc54bc034ba45267c8f91/packages/nx/src/project-graph/project-graph.ts#L87

  // const projectGraph = await createProjectGraphAsync()

  // SM: in Nx 14.5.x projectGraph is passed in via context
  // @nx/js:tsc executor uses readCachedProjectGraph, so we'll use it too
  // https://github.com/nrwl/nx/blob/13.10.x/packages/js/src/utils/check-dependencies.ts
  // https://github.com/nrwl/nx/blob/14.5.x/packages/js/src/utils/check-dependencies.ts
  // const projectGraph = readCachedProjectGraph()

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
