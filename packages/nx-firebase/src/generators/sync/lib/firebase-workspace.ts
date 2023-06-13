import { Tree } from '@nx/devkit'
import { getFirebaseChanges } from './firebase-changes'
import { getFirebaseProjects } from './firebase-projects'
import { FirebaseWorkspace } from './types'
import { getFirebaseConfigs } from './firebase-configs'

export function getFirebaseWorkspace(tree: Tree): FirebaseWorkspace {
  // build list of firebase apps and functions in the workspace
  const projects = getFirebaseProjects(tree)
  const configs = getFirebaseConfigs(tree, projects)
  const changes = getFirebaseChanges(tree, projects, configs)

  return {
    ...projects,
    ...changes,
    ...configs,
  }
}
