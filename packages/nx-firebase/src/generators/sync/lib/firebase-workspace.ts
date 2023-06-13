import { Tree } from '@nx/devkit'
import { getFirebaseWorkspaceChanges } from './firebase-changes'
import { getFirebaseProjects } from './firebase-projects'
import { FirebaseWorkspace } from './types'

export function getFirebaseWorkspace(tree: Tree): FirebaseWorkspace {
  // build list of firebase apps and functions in the workspace
  const projects = getFirebaseProjects(tree)
  const changes = getFirebaseWorkspaceChanges(tree, projects)

  return {
    ...projects,
    ...changes,
  }
}
