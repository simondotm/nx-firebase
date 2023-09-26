import {
  ExecutorContext,
  logger,
  TargetConfiguration,
  ProjectConfiguration,
} from '@nx/devkit'
import { FirebaseServeExecutorSchema } from './schema'
import { spawn } from 'child_process'

type NxRunCommandsTargetConfiguration = TargetConfiguration<{
  command?: string
  commands?: string[]
}>

type ValidTarget = 'firebase' | 'watch' | 'emulate'

function getCommandFromTarget(
  project: ProjectConfiguration,
  targetName: ValidTarget,
  commandGrep: string,
) {
  const target = project.targets[targetName] as NxRunCommandsTargetConfiguration
  if (!target) {
    throw new Error(
      `Could not find target '${targetName}' in project '${project.name}'`,
    )
  }
  const commands: string[] = [
    ...(target.options.command ? [target.options.command] : []),
    ...(target.options.commands ? target.options.commands : []),
  ].filter((cmd) => cmd.includes(commandGrep))

  if (commands.length === 0) {
    throw new Error(
      `Could not find a command in target '${targetName}' that matches '${commandGrep}'`,
    )
  }

  if (commands.length !== 1) {
    logger.warn(
      `Found multiple commands in target '${targetName}' that match '${commandGrep}', using first match`,
    )
  }
  return commands[0]
}

export default async function runFirebaseServeExecutor(
  options: FirebaseServeExecutorSchema,
  context: ExecutorContext,
) {
  return new Promise<{ success: boolean }>((resolve) => {
    const projectName = context.projectName
    const projects = context.projectsConfigurations
    const project = projects.projects[projectName]

    // Determine the watch target command
    const watchCommand = getCommandFromTarget(
      project,
      'watch',
      'nx run-many --targets=build',
    )

    // Determine the firebase target command, so we get --config & --project
    const firebaseCommand = getCommandFromTarget(
      project,
      'firebase',
      'firebase',
    )

    // Determine the emulator target command
    const emulateCommand = getCommandFromTarget(
      project,
      'emulate',
      'emulators:',
    ).replace(`nx run ${projectName}:firebase`, '')

    // Run the watch process
    // eslint-disable-next-line
    const watchProcess = spawn(watchCommand, [], {
      shell: true,
      stdio: 'inherit',
      detached: false,
    }).on('exit', (code) => {
      if (!code) {
        logger.warn(`serve: watch process finished successfully`)
      } else {
        logger.error(`serve: watch process finished with error '${code}'`)
      }
    })

    // determine any extra commands passed on the command line
    const extraArgs =
      options.__unparsed__.length > 0
        ? ' ' + options.__unparsed__.join(' ')
        : ''

    // Run the firebase emulator process
    const emulatorProcess = spawn(
      `${firebaseCommand} ${emulateCommand} ${extraArgs}`,
      [],
      {
        shell: true,
        stdio: 'inherit',
        detached: false,
      },
    )
    emulatorProcess.on('exit', (code) => {
      if (!code) {
        logger.warn(`serve: Firebase emulator finished successfully`)
        resolve({ success: true }) // not sure what difference this makes
      } else {
        logger.error(`serve: Firebase emulator finished with error '${code}'`)
        resolve({ success: false })
      }
    })

    // Handle signals for serve executor process
    const processExitListener = (signal) => {
      // logger.error(`\nserve: executor received signal '${signal}'`)
      if (signal === 'SIGINT') {
        logger.warn(`\nserve: terminating`)
        // no need for these it seems
        // emulatorProcess.kill()
        // watchProcess.kill()
      }
      if (signal === 0) {
        logger.warn(`serve: finished successfully`)
      }
      if (signal === 1) {
        logger.error(`serve: finished with errors`)
      }
    }
    process.on('exit', processExitListener)
    process.on('SIGTERM', processExitListener)
    process.on('SIGINT', processExitListener)
  })
}
