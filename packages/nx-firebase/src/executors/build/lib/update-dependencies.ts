import {
  createProjectGraphAsync,
  ExecutorContext,
  joinPathFragments,
  logger,
  ProjectGraphDependency,
  readJsonFile,
  writeJsonFile,
  readCachedProjectGraph,
} from '@nrwl/devkit'

import {
  calculateProjectDependencies,
  DependentBuildableProjectNode,
  updateBuildableProjectPackageJsonDependencies,
} from '@nrwl/workspace/src/utilities/buildable-libs-utils'

import { copy, removeSync } from 'fs-extra'

const ENABLE_DEBUG = true
function debugLog(...args) {
  if (ENABLE_DEBUG) {
    console.log(args)
  }
}

export async function updateFirebaseDependencies(
  context: ExecutorContext,
  targetDir: string,
) {
  logger.log(
    "- Processing dependencies for firebase functions app '" +
      context.projectName +
      "':",
  )

  // const graph = await createProjectGraphAsync()
  const graph = context.projectGraph

  const dependenciesa = graph.dependencies[context.projectName]
  debugLog(
    'graph direct dependencies=' + JSON.stringify(dependenciesa, null, 3),
  )

  /*
  debugLog('graph.nodes=' + JSON.stringify(graph.nodes, null, 3))
  debugLog('graph.dependencies=' + JSON.stringify(graph.dependencies, null, 3))
  */

  //const dependencies = graph.dependencies
  const {
    target,
    dependencies,
    nonBuildableDependencies,
    topLevelDependencies,
  } = calculateProjectDependencies(
    graph,
    context.root,
    context.projectName,
    context.targetName,
    context.configurationName,
  )
  debugLog('calculated dependencies=' + JSON.stringify(dependencies, null, 3))
  debugLog('target=' + JSON.stringify(target, null, 3))
  debugLog(
    'nonBuildableDependencies=' +
      JSON.stringify(nonBuildableDependencies, null, 3),
  )
  debugLog(
    'topLevelDependencies=' + JSON.stringify(topLevelDependencies, null, 3),
  )

  // list npm deps first, sorted alphabetically
  const npmDeps = dependencies
    .filter((dep: DependentBuildableProjectNode) => dep.node.type === 'npm')
    .sort(
      (a: DependentBuildableProjectNode, b: DependentBuildableProjectNode) =>
        a.name.localeCompare(b.name),
    )
  for (const d of npmDeps) {
    const type = d.node.type
    logger.log(" -  Added '" + type + "' dependency '" + d.name + "'")
  }

  // Sniff out any dependencies of this application that are
  //  non-buildable libraries
  // These won't show up in `dependencies` because they don't have a `build` target
  //
  // Probably added as user error (done it myself) so better to warn here explicitly
  // than ignore it and allow wierd side-effects to happen if we proceed.
  const projectDeps = graph.dependencies[context.projectName].map((dep) => {
    const depName = dep.target
    const node = graph.nodes[depName]
    return node
  })

  const nonBuildableDeps = projectDeps.filter((dep) => {
    return dep && dep.type === 'lib' && dep.data.targets['build'] === undefined
  })
  //console.log("nonBuildableDeps=", JSON.stringify(nonBuildableDeps, null, 3));

  const updateBuildableProjectDepsInPackageJson = true // options.updateBuildableProjectDepsInPackageJson

  // automatically add any dependencies this application has to the output "package.json"
  // this will include both npm imports and workspace library imports
  // non-buildable deps will not show up here, but we've captured them already
  if (dependencies.length > 0 && updateBuildableProjectDepsInPackageJson) {
    updateBuildableProjectPackageJsonDependencies(
      context.root,
      context.projectName,
      context.targetName,
      context.configurationName,
      target,
      dependencies,
      'dependencies',
    )
  }

  // final custom step for building firebase functions applications is to:
  // - identify any workspace library dependencies
  // - copy them to the application dist folder
  // - update the output "package.json" to use local file references to these libraries
  //
  // This ensures that:
  // - the firebase CLI deploy command will work correctly
  // - all code for the functions is self contained with the dist/app/<firebaseapp> folder
  // - all local code for the functions will be uploaded to GCP without any need to faff with private npm packages

  // create a list of dependencies that are nx workspace libraries, sorted alphabetically
  const workspaceDependencies = dependencies
    .filter((dep: DependentBuildableProjectNode) => {
      return dep.node.type === 'lib'
    })
    .sort(
      (a: DependentBuildableProjectNode, b: DependentBuildableProjectNode) =>
        a.name.localeCompare(b.name),
    )

  // copy each of their build outputs in dist to a "libs" sub directory in our application dist output folder
  const depLibsDir = 'libs'
  const workspaceRoot = context.root
  const localLibraries: { [name: string]: DependentBuildableProjectNode } = {}
  for (const dep of workspaceDependencies) {
    const localPackageName = dep.name // the library dependency package name
    const localLibraryName = dep.node.name // the library dependency project name
    localLibraries[localPackageName] = dep
    const srcDir = joinPathFragments(workspaceRoot, dep.outputs[0])
    const outDir = joinPathFragments(
      workspaceRoot,
      targetDir,
      depLibsDir,
      localLibraryName,
    )
    // we also copy libraries to node_modules in dist, because the Firebase CLI also runs the entry point script during a deploy to determine the exported functions
    // however, firebase does NOT upload node_modules to GCP, so we have to make two copies of each dependent local library package
    // see: https://firebase.google.com/docs/functions/handle-dependencies
    const nodeModulesDir = joinPathFragments(
      workspaceRoot,
      targetDir,
      'node_modules',
      localPackageName,
    )
    try {
      debugLog(
        "- Copying dependent workspace library '" +
          dep.node.name +
          "' from '" +
          srcDir +
          "' to '" +
          outDir +
          "'",
      )
      debugLog(
        "- Copying dependent workspace library '" +
          dep.node.name +
          "' from '" +
          srcDir +
          "' to '" +
          nodeModulesDir +
          "'",
      )
      await copy(srcDir, outDir)
      await copy(srcDir, nodeModulesDir)
      logger.log(" - Copied 'lib' dependency '" + dep.name + "'")
    } catch (err) {
      logger.error(err.message)
    }
  }

  const incompatibleNestedDeps: string[] = []

  // rewrite references to library packages in the functions package.json
  // to be local package references to the copies we made
  const functionsPackageFile = joinPathFragments(targetDir, 'package.json')

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

        // detect any incompatible nested libraries
        if (d.split('/').length > 2) {
          incompatibleNestedDeps.push(d)
        }
      }
    }
  }
  writeJsonFile(functionsPackageFile, functionsPackageJson)
  logger.log('- Updated firebase functions package.json')
  debugLog(
    'functions package deps = ',
    JSON.stringify(functionsPackageDeps, null, 3),
  )

  // Final dep check before we compile for:
  // 1) non-buildable libraries
  // 2) nested libraries generated without `--importPath`
  // These are both show-stoppers for successful Firebase functions compilation
  // If any bad dependencies were found, report and throw

  // Non-buildable library dependencies are a show stopper
  // If any bad dependencies were found, report and throw
  for (const dep of nonBuildableDeps) {
    logger.error(
      "ERROR: Found non-buildable library dependency '" +
        dep.name +
        "' in Firebase Application. Imported libraries must be created with `--buildable`.",
    )
  }
  for (const dep of incompatibleNestedDeps) {
    logger.error(
      "ERROR: Found incompatible nested library dependency '" +
        dep +
        "' in Firebase Application. Imported nested libraries must be created with `--importPath`.",
    )
  }
  if (nonBuildableDeps.length || incompatibleNestedDeps.length) {
    throw new Error(
      'ERROR: Firebase Application contains references to non-buildable or incompatible nested libraries, please fix in order to proceed with build.',
    )
  }

  return dependencies
}
