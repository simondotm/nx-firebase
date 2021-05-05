import { FunctionsExecutorSchema } from './schema';

import { ExecutorContext } from '@nrwl/devkit';
import { createProjectGraph } from '@nrwl/workspace/src/core/project-graph';
import {
  calculateProjectDependencies,
  checkDependentProjectsHaveBeenBuilt,
  updateBuildableProjectPackageJsonDependencies,
} from '@nrwl/workspace/src/utilities/buildable-libs-utils';

export default async function runExecutor(options: FunctionsExecutorSchema, context: ExecutorContext) {
  console.log('Executor ran for functions', options);
    const projGraph = createProjectGraph();
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

  for (const d of dependencies) {
      console.log(" Dependency - " + d.name)
  }

  return {
    success: true,
  };
}
