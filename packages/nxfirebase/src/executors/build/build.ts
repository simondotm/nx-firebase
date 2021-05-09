//SM: as of nx v12.1.1, we need this patch for ensuring the correct workspace is set in e2e runs
// See: https://github.com/nrwl/nx/issues/5065
import '../../utils/e2ePatch'

import { FirebaseBuildExecutorSchema } from './schema';

import { ExecutorContext } from '@nrwl/devkit';
import { createProjectGraph } from '@nrwl/workspace/src/core/project-graph';
import { assetGlobsToFiles, copyAssetFiles, copyAssets } from '@nrwl/workspace/src/utilities/assets';
import {
  calculateProjectDependencies,
  checkDependentProjectsHaveBeenBuilt,
  createTmpTsConfig,
  DependentBuildableProjectNode,
  updateBuildableProjectPackageJsonDependencies,
} from '@nrwl/workspace/src/utilities/buildable-libs-utils';
//import { NodePackageBuilderOptions } from './utils/models';
import compileTypeScriptFiles from './node/package/utils/compile-typescript-files';
import updatePackageJson from './node/package/utils/update-package-json';
import normalizeOptions from './node/package/utils/normalize-options';
import addCliWrapper from './node/package/utils/cli';
import { readJsonFile } from '@nrwl/workspace'
import { join } from 'path'
import { copy } from 'fs-extra';
import { writeJsonFile } from '@nrwl/workspace/src/utilities/fileutils'

/**
 * Custom Firebase Functions "Application" nx build exector
 * @param options 
 * @param context 
 * @returns build success/failure outcome
 */
export default async function runExecutor(options: FirebaseBuildExecutorSchema, context: ExecutorContext) {
  console.log("Running Executor for Firebase Build for project '" + context.projectName + "'");
  console.log('options=', options)
  // get the project graph; returns an object containing all nodes in the workspace, files, and dependencies
  const projGraph = createProjectGraph();
  // nx firebase functions are essentially @nrwl/node:package libraries, but are added to the project
  // as applications as they are fundamentally the deployable "application" output of a build pipeline.
  // Due to this, we can import standard node libraries as dependencies from within the workspace
  //  however, they must be created as "buildable" node libraries, because we have to ensure the
  //  firebase CLI can reference these libraries locally from within the dist folder when they are deployed.
  const appRoot = context.workspace.projects[context.projectName].root;
  const normalizedOptions = normalizeOptions(options, context, appRoot);
  const { target, dependencies } = calculateProjectDependencies(
    projGraph,
    context.root,
    context.projectName,
    context.targetName,
    context.configurationName
  );

/*
    normalizedOptions.tsConfig = createTmpTsConfig(
      options.tsConfig,
      context.root,
      target.data.root,
      dependencies
    );
        console.log("tsConfig=" + JSON.stringify(normalizedOptions.tsConfig, null, 3))
        console.log("libRoot=" + libRoot)
        console.log("target=" + JSON.stringify(target, null, 3))

    const tscfg = readJsonFile(normalizedOptions.tsConfig)
        console.log("tsConfig=" + JSON.stringify(tscfg, null, 3))
*/

  const dependentsBuilt = checkDependentProjectsHaveBeenBuilt(
    context.root,
    context.projectName,
    context.targetName,
    dependencies
  );
  if (!dependentsBuilt) {
    throw new Error();
  }
    console.log("dependencies=" + JSON.stringify(dependencies, null, 3))

  for (const d of dependencies) {
      const type = d.node.type
      console.log("- Firebase functions app has '" + type + "' dependency '" + d.name + "'")
  }


  // compile the firebase functions application
  // uses the same builder logic as @nrwl/node:package
  // since we do not want or need to use webpack for cloud functions
  const result = await compileTypeScriptFiles(
    normalizedOptions,
    context,
    appRoot,
    dependencies
  );

  // there aren't really any assets needed for firebase functions
  // but left here for compatibility with node:package
    console.log("- Copying functions assets")
  await copyAssetFiles(normalizedOptions.files);



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
  const assetsGlob = [ '**/*' ]
  /*
  for (const dep of workspaceDependencies) {
      const rootDir = join(workspaceRoot, dep.outputs[0])
      const outDir = join(workspaceRoot, normalizedOptions.outputPath, depLibsDir, dep.node.name);
      console.log("- Copying dependent workspace library '" + dep.node.name + "' from '" + rootDir + '/' + assetsGlob[0] + "' to '" + outDir + "'")
      const files = assetGlobsToFiles(assetsGlob, rootDir, outDir);
      console.log("files=" + JSON.stringify(files, null, 3))
      await copyAssetFiles(files)
  }
  */

  const localLibraries: { [name:string]: DependentBuildableProjectNode } = {}
  for (const dep of workspaceDependencies) {
      const localPackageName = dep.name // the library dependency package name
      const localLibraryName = dep.node.name // the library dependency project name
      localLibraries[localPackageName] = dep
      const srcDir = join(workspaceRoot, dep.outputs[0])
      const outDir = join(workspaceRoot, normalizedOptions.outputPath, depLibsDir, localLibraryName);
      // we also copy libraries to node_modules in dist, because the Firebase CLI also runs the entry point script during a deploy to determine the exported functions
      // however, firebase does NOT upload node_modules to GCP 
      // see: https://firebase.google.com/docs/functions/handle-dependencies
      const nodeModulesDir = join(workspaceRoot, normalizedOptions.outputPath, 'node_modules', localPackageName);
        try {
            console.log("- Copying dependent workspace library '" + dep.node.name + "' from '" + srcDir + "' to '" + outDir + "'")
            await copy(srcDir, outDir);
            console.log("- Copying dependent workspace library '" + dep.node.name + "' from '" + srcDir + "' to '" + nodeModulesDir + "'")
            await copy(srcDir, nodeModulesDir);
        } catch (err) {
            console.error(err.message)
        }    
  }

  // rewrite references to library packages in the functions package.json
  // to be local package references to the copies we made
  const functionsPackageFile = `${options.outputPath}/package.json`
  console.log("- functions PackageFile=" + functionsPackageFile)
  const functionsPackageJson = readJsonFile(functionsPackageFile);
  const functionsPackageDeps = functionsPackageJson.dependencies;
  if (functionsPackageDeps) {
      console.log("- Updating local dependencies for Firebase functions package.json")
      for (const d in functionsPackageDeps) {
          const localDep = localLibraries[d]
          console.log("- Checking dependency '" + d + "', isLocalDep=" + (localDep!==undefined))
          if (localDep) {
              const localRef = 'file:' + join('.', 'libs', localDep.node.name)
              console.log(" - Replacing '" + d + "' with '" + localRef + "'")
              functionsPackageDeps[d] = localRef
          }
      }
  }
  writeJsonFile(functionsPackageFile, functionsPackageJson);
  console.log("functions package deps = ", JSON.stringify(functionsPackageDeps, null, 3))



  if (options.cli) {
    addCliWrapper(normalizedOptions, context);
  }

  return {
    ...result,
    outputPath: normalizedOptions.outputPath,
  };


}
