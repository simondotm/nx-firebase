import {
  ProjectConfiguration,
  Tree,
  logger,
  updateProjectConfiguration,
} from '@nx/devkit'
import { debugInfo } from './debug'

/**
 * Parse a firebase tag value for the given scope
 * Expected to find tag of format: `firebase:name:<projectname>` or `firebase:dep:<appname>`
 * @param project - Project to be checked
 * @param scope - `firebase:name` or `firebase:dep`
 * @returns value part of tag
 * @throws if requested tag is missing, or malformed
 */
export function getFirebaseScopeFromTag(
  project: ProjectConfiguration,
  scope: 'firebase:name' | 'firebase:dep',
) {
  const tags = project.tags
  // let foundTag = false
  if (tags) {
    for (let i = 0; i < tags.length; ++i) {
      const tag = tags[i]
      debugInfo(`- checking tag '${tag}' for scope '${scope}'`)
      if (tag.includes(scope)) {
        debugInfo(`- matched tag '${tag}' for scope '${scope}'`)
        // foundTag = true
        const scopes = tag.split(':')
        if (scopes.length === 3) {
          debugInfo(`- returning tagValue '${scopes[2]}' tagIndex '${i}'`)
          return { tagValue: scopes[2], tagIndex: i }
        } else {
          throw new Error(
            `Malformed '${scope}' tag in project '${project.name}', expected '${scope}:<value>', found '${tag}'`,
          )
          // logger.error(
          //   `Malformed '${scope}' tag in project '${project.name}', expected '${scope}:<value>', found '${tag}'.`,
          // )
        }
      }
    }
  }
  throw new Error(
    `Project '${project.name}' has a missing '${scope}' tag in project. Ensure this is set correctly.`,
  )
  // if (!foundTag) {
  //   logger.error(
  //     `Project '${project.name}' has a missing '${scope}' tag in project.`,
  //   )
  // }
  // return undefined
}

// export function updateFirebaseScopeTag(
//   project: ProjectConfiguration,
//   scope: 'firebase:name' | 'firebase:dep',
//   value: string
// ) {

// }

export function updateFirebaseProjectNameTag(
  tree: Tree,
  project: ProjectConfiguration,
) {
  const appNameTag = getFirebaseScopeFromTag(project, 'firebase:name')
  const newAppNameTag = `firebase:name:${project.name}`
  project.tags[appNameTag.tagIndex] = newAppNameTag
  updateProjectConfiguration(tree, project.name, project)
}
