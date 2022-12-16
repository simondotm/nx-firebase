import { ExecutorContext } from '@nrwl/devkit';
import { createProjectGraphAsync } from '@nrwl/workspace/src/core/project-graph';

import {
  calculateProjectDependencies,
  checkDependentProjectsHaveBeenBuilt,
  updateBuildableProjectPackageJsonDependencies,
} from '@nrwl/workspace/src/utilities/buildable-libs-utils';
import { NodePackageBuilderOptions } from './utils/models';
import compileTypeScriptFiles from './utils/compile-typescript-files';
import updatePackageJson from './utils/update-package-json';
import normalizeOptions from './utils/normalize-options';
import addCliWrapper from './utils/cli';
import { copy } from 'fs-extra';

export async function packageExecutor(
  options: NodePackageBuilderOptions,
  context: ExecutorContext
) {
  const projGraph = await createProjectGraphAsync();//'4.0');
  const libRoot = context.workspace.projects[context.projectName].root;
  const normalizedOptions = normalizeOptions(options, context, libRoot);
  const { target, dependencies } = calculateProjectDependencies(
    projGraph,
    context.root,
    context.projectName,
    context.targetName,
    context.configurationName
  );
  const dependentsBuilt = checkDependentProjectsHaveBeenBuilt(
    context.root,
    context.projectName,
    context.targetName,
    dependencies
  );
  if (!dependentsBuilt) {
    throw new Error();
  }

  const result = await compileTypeScriptFiles(
    normalizedOptions,
    context,
    libRoot,
    dependencies
  );

  await Promise.all(normalizedOptions.files.map((file) => copy(file.input, file.output)));


  updatePackageJson(normalizedOptions, context);
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

  if (options.cli) {
    addCliWrapper(normalizedOptions, context);
  }

  return {
    ...result,
    outputPath: normalizedOptions.outputPath,
  };
}

export default packageExecutor;
