import {
  ProjectConfiguration,
  TargetConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit'

type NxRunCommandsTargetConfiguration = TargetConfiguration<{
  command?: string
  commands?: string[]
}>

type ValidTarget =
  | 'firebase'
  | 'watch'
  | 'emulate'
  | 'lint'
  | 'test'
  | 'serve'
  | 'deploy'
  | 'getconfig'
  | 'killports'

export function renameCommandForTarget(
  tree: Tree,
  project: ProjectConfiguration,
  targetName: ValidTarget,
  search: string,
  replace: string,
) {
  const target = project.targets[targetName] as NxRunCommandsTargetConfiguration
  if (!target) {
    throw new Error(
      `Could not find target '${targetName}' in project '${project.name}'`,
    )
  }
  if (target.options.commands) {
    target.options.commands = target.options.commands.map((cmd) => {
      return cmd.replace(search, replace)
    })
  }
  if (target.options.command) {
    target.options.command = target.options.command.replace(search, replace)
  }
  updateProjectConfiguration(tree, project.name, project)
}
