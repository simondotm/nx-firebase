import { ProjectConfiguration, logger } from '@nx/devkit'

export function getFirebaseScopeFromTag(
  project: ProjectConfiguration,
  scope: string,
) {
  const tags = project.tags
  let foundTag = false
  if (tags) {
    for (let i = 0; i < tags.length; ++i) {
      const tag = tags[i]
      if (tag.includes(scope)) {
        foundTag = true
        const scopes = tag.split(':')
        if (scopes.length === 3) {
          return { tagValue: scopes[2], tagIndex: i }
        } else {
          logger.error(
            `Malformed '${scope}' tag in project '${project.name}', expected '${scope}:<value>', found '${tag}'.`,
          )
        }
      }
    }
  }
  if (!foundTag) {
    logger.error(
      `Project '${project.name}' has a missing '${scope}' tag in project.`,
    )
  }
  return undefined
}
