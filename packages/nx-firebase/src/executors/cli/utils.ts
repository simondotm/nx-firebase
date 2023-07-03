import { execSync } from 'node:child_process'
import { setTimeout } from 'node:timers/promises'
import { Separator, select } from '@inquirer/prompts'
import { ExecutorContext, joinPathFragments, logger } from '@nx/devkit'
import parseHelp from 'parse-help'
import yargs from 'yargs/yargs'
import { CliExecutorSchema } from './schema'

export const parseCommand = (command: string): string => {
  if (command[0] === '"' && command.at(-1) === '"') {
    return command.slice(1, -1)
  }
  return command
}

export const runCommand = (command: string): void => {
  execSync(parseCommand(command), {
    stdio: 'inherit',
  })
}

export const runCommands = (commands: string[]): void => {
  for (const command of commands) {
    runCommand(command)
  }
}

export const isString = (u: unknown): u is string => {
  if (typeof u === 'string') return true
  return false
}

const getFirebaseProject = async (
  project?: string,
): Promise<string | undefined> => {
  if (project) return project
  let activeFirebaseProject = execSync(
    `echo $(echo $(grep "$(pwd)" ~/.config/configstore/firebase-tools.json | cut -d" " -f2)" " | sed -e 's/"//g')`,
  )
    .toString()
    .trim()

  if (!activeFirebaseProject) {
    logger.error(
      `No firebase project has been explicitly set and No active project. Please select desired project with 'firebase use' or select project when running command`,
    )

    return undefined
  }

  if (activeFirebaseProject.at(-1) === ',') {
    activeFirebaseProject = activeFirebaseProject.slice(0, -1)
  }

  const useActiveProject = select({
    message: `Use active project (${activeFirebaseProject})?`,
    choices: [
      {
        name: 'Yes',
        value: true,
      },
      {
        name: 'No',
        value: false,
      },
      new Separator(),
    ],
  })

  const defaultUseActiveProject = setTimeout(10000).then(() => {
    useActiveProject.cancel()
    return false
  })

  const answer = await Promise.race([defaultUseActiveProject, useActiveProject])

  if (!answer) {
    logger.error(
      `Select desired project with 'firebase use' or select project when running command`,
    )
    return undefined
  }

  return activeFirebaseProject
}

export const normalizeOptions = async (
  options: CliExecutorSchema & {
    [key: string]: unknown
  },
  context: Pick<ExecutorContext, 'root'>,
): Promise<{ _: string[]; args: Record<string, unknown> }> => {
  const { command, config, _: params, project, ...additionalArgs } = options

  const { $0, _: commandParams, ...commandArgs } = await yargs(command).argv

  const [cCommand, ...cParams] = commandParams.map((value) => {
    return value.toString()
  })

  if (cCommand === params[0]) {
    params.shift()
  }

  if (cParams.length > 0 && params.length > 0) {
    logger.warn('Conflicting parameters for firebase command')
    logger.warn(`Parameters to ignore [${cParams.toString()}]`)
    logger.warn(`Parameters to use [${params.toString()}]`)
  }

  const finalParams = [
    cCommand,
    ...(params ?? cParams).map((value) => {
      if (value[0] !== '"' && value.at(-1) !== '"' && value.includes(' ')) {
        return '"' + value + '"'
      }
      return value
    }),
  ].filter(Boolean)

  //Set up args
  const finalArgs = {
    ...commandArgs,
    ...additionalArgs,
  }

  const finalArgsProject =
    typeof finalArgs.project === 'string' ? finalArgs.project : undefined

  const firebaseProject = await getFirebaseProject(project ?? finalArgsProject)
  finalArgs.project = firebaseProject
  finalArgs.config = joinPathFragments(context.root, config)

  return {
    _: finalParams,
    args: finalArgs,
  }
}

export const stringifyFirebaseArgs = (
  command: string,
  args: Record<string, unknown>,
): string => {
  const base = parseHelp(execSync('firebase --help'))
  const base2 = parseHelp(execSync(`firebase ${command} --help`))

  const validArgs = Object.keys({
    ...base.flags,
    ...base.aliases,
    ...base2.flags,
    ...base2.aliases,
  })

  const argsToBeUsed = Object.keys(args)
    .filter((p) => validArgs.indexOf(p) !== -1)
    .reduce((m, c) => ((m[c] = args[c]), m), {})

  return Object.keys(argsToBeUsed)
    .map((a) =>
      argsToBeUsed[a] === true || argsToBeUsed[a] === 'true'
        ? `--${a}`
        : `--${a}=${argsToBeUsed[a]}`,
    )
    .join(' ')
}
