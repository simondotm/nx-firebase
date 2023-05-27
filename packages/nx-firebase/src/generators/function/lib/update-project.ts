import {
  Tree,
  readProjectConfiguration,
  updateProjectConfiguration,
} from '@nrwl/devkit'
import type { NormalizedOptions } from '../schema'

export function updateProject(tree: Tree, options: NormalizedOptions): void {
  const project = readProjectConfiguration(tree, options.projectName)

  const firebaseAppProject = options.firebaseAppProject
  // const firebaseConfig = options.firebaseConfigName ?? ''
  // const firebaseProject = options.firebaseProject
  // ? ` --project=${options.firebaseProject}`
  // : ''

  // replace the default node build target with a simplified version
  // we dont need dev/production build configurations for firebase functions since its a confined secure environment
  project.targets.build = {
    executor: '@nx/esbuild:esbuild',
    outputs: ['{options.outputPath}'],
    options: {
      outputPath: project.targets.build.options.outputPath,
      main: project.targets.build.options.main,
      tsConfig: project.targets.build.options.tsConfig,
      assets: project.targets.build.options.assets,
      generatePackageJson: true,
      // bundle: true, // default for esbuild
      // thirdParty: false, // default for esbuild
      target: 'node16',
      format: [options.format || 'esm'], // default for esbuild is esm
      esbuildOptions: {
        logLevel: 'info',
      },
    },
  }
  project.targets.deploy = {
    executor: 'nx:run-commands',
    options: {
      // command: `firebase deploy${firebaseProject} --config=${firebaseConfig}`,
      // use the firebase app to deploy, this way the function does not need to know the project or config
      command: `nx run ${firebaseAppProject.name}:deploy --only functions:${options.projectName}`,
    },
    dependsOn: ['build'],
  }

  // Remove default node app serve target
  // No serve target for functions, since we may have multiple functions in a firebase project
  // Instead we serve at the firebase app project
  delete project.targets.serve

  updateProjectConfiguration(tree, options.projectName, project)

  // Add function project as implicit dep of firebase app project
  firebaseAppProject.implicitDependencies ||= []
  firebaseAppProject.implicitDependencies.push(options.projectName)
  updateProjectConfiguration(tree, options.firebaseApp, firebaseAppProject)
}
