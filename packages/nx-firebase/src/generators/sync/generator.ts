import {
  formatFiles,
  readProjectConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit'

import { SyncGeneratorSchema } from './schema'

function updateFirebaseProject(
  parent: Record<string, string>,
  options: SyncGeneratorSchema,
) {
  for (const key in parent) {
    if (typeof key === 'object') {
      updateFirebaseProject(
        parent.key as unknown as Record<string, string>,
        options,
      )
    } else {
      // check for --project updates
      const v = parent[key]
      if (v.includes('firebase deploy')) {
        if (v.includes('--project')) {
          // already set, so update
          const regex = /(--profile[ =])([A-Za-z-]+)/
          v.replace(regex, '$1' + options.project)
        } else {
          // no set, so add
          const regex = /(firebase deploy)/
          v.replace(regex, '$1' + ' ' + `--deploy=${options.project}`)
        }
      }
    }
  }
}

export default async function (tree: Tree, options: SyncGeneratorSchema) {
  if (options.project) {
    const project = readProjectConfiguration(tree, options.name)

    const deploy = project.targets.deploy as Record<string, string>
    updateFirebaseProject(deploy, options)

    updateProjectConfiguration(tree, options.name, project)
  }
}
