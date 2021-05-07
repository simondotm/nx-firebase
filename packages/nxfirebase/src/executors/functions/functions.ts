console.log("functions.ts before")

import '../../utils/e2ePatch'   // intentional side effects

console.log("functions.ts after")

import { FunctionsExecutorSchema } from './schema';

import { ExecutorContext, ProjectGraph, ProjectGraphNode } from '@nrwl/devkit';
import { createProjectGraph, ProjectType } from '@nrwl/workspace/src/core/project-graph';
import {
  calculateProjectDependencies,
  checkDependentProjectsHaveBeenBuilt,
  DependentBuildableProjectNode,
  updateBuildableProjectPackageJsonDependencies,
} from '@nrwl/workspace/src/utilities/buildable-libs-utils';

import {
    projectRootDir, readJsonFile, readNxJson, readWorkspaceJson 
} from '@nrwl/workspace'
import { readWorkspaceFiles } from '@nrwl/workspace/src/core/file-utils'
import { join } from 'path'
import { getOutputsForTargetAndConfiguration } from '@nrwl/workspace/src/tasks-runner/utils'





function isBuildable(target: string, node: ProjectGraphNode): boolean {
    console.log("isBuildable target=" + target)
    const nodeTargets = node.data.targets
    const nodeTarget = nodeTargets ? nodeTargets[target] : undefined
    const nodeTargetExecutor = nodeTarget ? nodeTarget.executor : undefined
    const isBuildableTarget = (nodeTargetExecutor && nodeTargetExecutor !== '') ? true : false
    console.log("node.data.targets=" + JSON.stringify(nodeTargets, null, 3))
    console.log("node.data.targets[target]=" + JSON.stringify(nodeTarget, null, 3))
    console.log("node.data.targets[target].executor=" + nodeTargetExecutor)
    console.log("isBuildableTarget=" + isBuildableTarget)

    const buildable = (
        node.data.targets &&
        node.data.targets[target] &&
        node.data.targets[target].executor !== ''
      );
  console.log("target " + target + " is buildable = " + buildable)
  return buildable
}

function myCalculateProjectDependencies(
  projGraph: ProjectGraph,
  root: string,
  projectName: string,
  targetName: string,
  configurationName: string
): { target: ProjectGraphNode; dependencies: DependentBuildableProjectNode[] } {

    console.log("myCalculateProjectDependencies")
  const target = projGraph.nodes[projectName];
  // gather the library dependencies
  const dependencies = recursivelyCollectDependencies(
    projectName,
    projGraph,
    []
  )
    .map((dep) => {
      const depNode = projGraph.nodes[dep];
      console.log("Found depNode=" + JSON.stringify(depNode, null, 3))
      if (
        depNode.type === ProjectType.lib &&
        isBuildable(targetName, depNode)
      ) {
        const libPackageJson = readJsonFile(
          join(root, depNode.data.root, 'package.json')
        );
          console.log("found buildable lib project dependency " + targetName + ", packagename= " + libPackageJson.name)

        return {
          name: libPackageJson.name, // i.e. @workspace/mylib
          outputs: getOutputsForTargetAndConfiguration(
            {
              overrides: {},
              target: {
                project: projectName,
                target: targetName,
                configuration: configurationName,
              },
            },
            depNode
          ),
          node: depNode,
        };
      } else if (depNode.type === 'npm') {
                    console.log("found npm project dependency " + depNode.data.packageName)

        return {
          name: depNode.data.packageName,
          outputs: [],
          node: depNode,
        };
      } else {
        return null;
      }
    })
    .filter((x) => !!x);
  return { target, dependencies };
}

function recursivelyCollectDependencies(
  project: string,
  projGraph: ProjectGraph,
  acc: string[]
) {
  (projGraph.dependencies[project] || []).forEach((dependency) => {
    if (acc.indexOf(dependency.target) === -1) {
      acc.push(dependency.target);
      recursivelyCollectDependencies(dependency.target, projGraph, acc);
    }
  });
  return acc;
}









export default async function runExecutor(options: FunctionsExecutorSchema, context: ExecutorContext) {
  console.log('Executor ran for functions');
  // defaults for createProjectGraph
  //console.log("projectRootDir=", projectRootDir())
  console.log("__dirname=", __dirname)
  console.log("readWorkspaceJson=", JSON.stringify(readWorkspaceJson(), null, 3))
  console.log("readNxJson=", JSON.stringify(readNxJson(), null, 3))
  console.log("readWorkspaceFiles=", JSON.stringify(readWorkspaceFiles(), null, 3))

    //executor params
  console.log("options=" + JSON.stringify(options, null, 3))
  console.log("context=" + JSON.stringify(context, null, 3))

  //const targetName = context.targetName
  const targetName = 'build' // use a known target name to determine if dependencies are buildable. Our executor is not called 'build' so dependency targets will not be matched otherwise.
  // create project graph
    const projGraph = createProjectGraph();
    const { target, dependencies } = myCalculateProjectDependencies( // calculateProjectDependencies(
    projGraph,
    context.root,
    context.projectName,
    targetName,
    context.configurationName
  );
  const dependentsBuilt = checkDependentProjectsHaveBeenBuilt(
    context.root,
    context.projectName,
    targetName,
    dependencies
  );
  if (!dependentsBuilt) {
    throw new Error();
  }

    console.log("projGraph=" + JSON.stringify(projGraph, null, 3))
    console.log("target=" + JSON.stringify(target, null, 3))
    console.log("dependencies=" + JSON.stringify(dependencies, null, 3))


  for (const d of dependencies) {
      console.log(" Dependency - " + d.name)
  }

  return {
    success: true,
  };
}
