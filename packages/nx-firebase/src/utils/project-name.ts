import {
  getWorkspaceLayout,
  joinPathFragments,
  names,
  Tree,
  extractLayoutDirectory,
} from '@nrwl/devkit'

export function getProjectName(tree: Tree, name: string, directory?: string) {
  // console.log(`name ${name}`)
  // console.log(`directory ${directory}`)

  const { layoutDirectory, projectDirectory } =
    extractLayoutDirectory(directory)

  // console.log(`layoutDirectory ${layoutDirectory}`)
  // console.log(`projectDirectory ${projectDirectory}`)

  const appsDir = layoutDirectory ?? getWorkspaceLayout(tree).appsDir

  // console.log(`appsDir ${appsDir}`)

  const appDirectory = projectDirectory
    ? `${names(projectDirectory).fileName}/${names(name).fileName}`
    : names(name).fileName

  // console.log(`appDirectory ${appDirectory}`)

  const appProjectName = appDirectory.replace(new RegExp('/', 'g'), '-')

  // console.log(`appProjectName ${appProjectName}`)

  const appProjectRoot = joinPathFragments(appsDir, appDirectory)

  // console.log(`appProjectRoot ${appProjectRoot}`)

  // // see https://github.com/nrwl/nx/blob/84cbcb7e105cd2b3bf5b3d84a519e5c52951e0f3/packages/js/src/generators/library/library.ts#L332
  // // for how the project name is derived from options.name and --directory
  // const fileName = names(name).fileName
  // const projectDirectory = directory
  //   ? `${names(directory).fileName}/${fileName}`
  //   : name

  // const projectRoot = joinPathFragments(
  //   getWorkspaceLayout(tree).appsDir,
  //   projectDirectory,
  // )

  // const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-')
  return {
    projectRoot: appProjectRoot,
    projectName: appProjectName,
  }
}
