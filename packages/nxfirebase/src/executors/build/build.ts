//SM: as of nx v12.1.1, we need this patch for ensuring the correct workspace is set in e2e runs
// See: https://github.com/nrwl/nx/issues/5065
import '../../utils/e2ePatch'

import { FirebaseBuildExecutorSchema } from './schema';

import { ExecutorContext } from '@nrwl/devkit';
import { createProjectGraph } from '@nrwl/workspace/src/core/project-graph';
import { copyAssetFiles } from '@nrwl/workspace/src/utilities/assets';
import {
  calculateProjectDependencies,
  checkDependentProjectsHaveBeenBuilt,
  DependentBuildableProjectNode,
  updateBuildableProjectPackageJsonDependencies,
} from '@nrwl/workspace/src/utilities/buildable-libs-utils';
//SM: Much of our build executor is based on @nrwl/node:package executor
import compileTypeScriptFiles from './node/package/utils/compile-typescript-files';
import updatePackageJson from './node/package/utils/update-package-json';
import normalizeOptions from './node/package/utils/normalize-options';
import addCliWrapper from './node/package/utils/cli';
import { readJsonFile } from '@nrwl/workspace'
import { join } from 'path'
import { copy, removeSync } from 'fs-extra';
import { writeJsonFile } from '@nrwl/workspace/src/utilities/fileutils'

const ENABLE_DEBUG = false
function debugLog(...args) {
    if (ENABLE_DEBUG) {
        console.log(args)
    }
}

/**
 * Custom Firebase Functions "Application" nx build exector
 * Based on @nrwl/node:package executor
 * 
 * - Builds the current application as a Typescript package library for Firebase functions
 * - Copies any dependent libraries to the dist folder
 * - Auto generates the firebase functions package.json
 * - Updates the firebase functions package.json to convert library dependency references to local file references
 * 
 * After building, the project can be deployed using the firebase CLI as usual
 * 
 * @param options 
 * @param context 
 * @returns build success/failure outcome
 */
export default async function runExecutor(options: FirebaseBuildExecutorSchema, context: ExecutorContext) {
  debugLog("Running Executor for Firebase Build for project '" + context.projectName + "'");
  debugLog('options=', options)
  
  // get the project graph; returns an object containing all nodes in the workspace, files, and dependencies
  const projGraph = createProjectGraph();
  // nx firebase functions are essentially @nrwl/node:package libraries, but are added to the project
  // as applications as they are fundamentally the deployable "application" output of a build pipeline.
  // Due to this, we can import standard node libraries as dependencies from within the workspace
  //  however, they must be created as "buildable" node libraries, because we have to ensure the
  //  firebase CLI can reference these libraries locally from within the dist folder when they are deployed.
  const appRoot = context.workspace.projects[context.projectName].root;
  const normalizedOptions = normalizeOptions(options, context, appRoot);
  //SM: note that the dependency search matches only buildable nodes in the tree
  // also, it matches candidate deps by targetName, so if your executor is called something other than "build" it wont find
  // any dependencies. Took me a few hours to figure that one out.
  const { target, dependencies } = calculateProjectDependencies(
    projGraph,
    context.root,
    context.projectName,
    context.targetName, 
    context.configurationName
  );


  // ensure dependent libraries exist.
  // note that this check does not check if they are out of date. Not quite sure yet how to do that, but --with-deps will always work.
  const dependentsBuilt = checkDependentProjectsHaveBeenBuilt(
    context.root,
    context.projectName,
    context.targetName,
    dependencies
  );
  if (!dependentsBuilt) {
    throw new Error("Dependent libraries need to be built first. Try adding '--with-deps' CLI option");
  }

  // clean the output folder
  if (normalizedOptions.deleteOutputPath) {
    removeSync(normalizedOptions.outputPath);
  }
  

  // there aren't really any assets needed for firebase functions
  // but left here for compatibility with node:package
  debugLog("- Copying functions assets")
  await copyAssetFiles(normalizedOptions.files);

  console.log("- Processing dependencies for firebase functions app")
  debugLog("dependencies=" + JSON.stringify(dependencies, null, 3))
  for (const d of dependencies) {
      const type = d.node.type
      console.log(" - Firebase functions app has '" + type + "' dependency '" + d.name + "'")
  }


  // ensure the output package file has typings and a correct "main" entry point
  updatePackageJson(normalizedOptions, context);

  // automatically add any dependencies this application has to the output "package.json"
  // this will include both npm imports and workspace library imports
  if (
    dependencies.length > 0 &&
    options.updateBuildableProjectDepsInPackageJson
  ) {
    updateBuildableProjectPackageJsonDependencies(
      context.root,
      context.projectName,
      context.targetName, 
      context.configurationName,
      target,
      dependencies,
      normalizedOptions.buildableProjectDepsInPackageJsonType
    );
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


  // create a list of dependencies that are nx workspace libraries
  const workspaceDependencies = dependencies.filter( (dep: DependentBuildableProjectNode) => {
    return (dep.node.type === 'lib');
  });

  // copy each of their build outputs in dist to a "libs" sub directory in our application dist output folder
  // do this AFTER the app typescript has compiled, because the outdir is deleted before the typescript build! (Doh! Spent an hour figuring that obvious gotcha out)
  const depLibsDir = 'libs'
  const workspaceRoot = context.root
  const localLibraries: { [name:string]: DependentBuildableProjectNode } = {}
  for (const dep of workspaceDependencies) {
      const localPackageName = dep.name // the library dependency package name
      const localLibraryName = dep.node.name // the library dependency project name
      localLibraries[localPackageName] = dep
      const srcDir = join(workspaceRoot, dep.outputs[0])
      const outDir = join(workspaceRoot, normalizedOptions.outputPath, depLibsDir, localLibraryName);
      // we also copy libraries to node_modules in dist, because the Firebase CLI also runs the entry point script during a deploy to determine the exported functions
      // however, firebase does NOT upload node_modules to GCP, so we have to make two copies of each dependent local library package
      // see: https://firebase.google.com/docs/functions/handle-dependencies
      const nodeModulesDir = join(workspaceRoot, normalizedOptions.outputPath, 'node_modules', localPackageName);
        try {
            debugLog("- Copying dependent workspace library '" + dep.node.name + "' from '" + srcDir + "' to '" + outDir + "'")
            debugLog("- Copying dependent workspace library '" + dep.node.name + "' from '" + srcDir + "' to '" + nodeModulesDir + "'")
            await copy(srcDir, outDir);
            await copy(srcDir, nodeModulesDir);
        } catch (err) {
            console.error(err.message)
        }    
  }

  console.log("- Updating firebase package.json")


  // rewrite references to library packages in the functions package.json
  // to be local package references to the copies we made
  const functionsPackageFile = `${options.outputPath}/package.json`
  
  debugLog("- functions PackageFile=" + functionsPackageFile)
  const functionsPackageJson = readJsonFile(functionsPackageFile);
  const functionsPackageDeps = functionsPackageJson.dependencies;
  if (functionsPackageDeps) {
      debugLog("- Updating local dependencies for Firebase functions package.json")
      for (const d in functionsPackageDeps) {
          const localDep = localLibraries[d]
          debugLog("- Checking dependency '" + d + "', isLocalDep=" + (localDep!==undefined))
          if (localDep) {
              const localRef = 'file:' + join('.', 'libs', localDep.node.name)
              debugLog(" - Replacing '" + d + "' with '" + localRef + "'")
              functionsPackageDeps[d] = localRef
          }
      }
  }
  writeJsonFile(functionsPackageFile, functionsPackageJson);
  debugLog("functions package deps = ", JSON.stringify(functionsPackageDeps, null, 3))



  if (options.cli) {
    addCliWrapper(normalizedOptions, context);
  }



  // compile the firebase functions Typescript application
  // uses the same builder logic as @nrwl/node:package
  // since we do not want or need to use webpack for cloud functions

  // So that we can support --watch (https://github.com/simondotm/nx-firebase/issues/11)
  // We run tsc as the last step, but we disable `deleteOutputPath` so that our previous steps are not deleted.
  normalizedOptions.deleteOutputPath = false;
  const result = await compileTypeScriptFiles(
    normalizedOptions,
    context,
    appRoot,
    dependencies
  );

  return {
    ...result,
    outputPath: normalizedOptions.outputPath,
  };


}
