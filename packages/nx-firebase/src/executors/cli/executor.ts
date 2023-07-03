import { ExecutorContext, logger } from '@nx/devkit'
import { CliExecutorSchema } from './schema'
import {
  isString,
  normalizeOptions,
  runCommands,
  stringifyFirebaseArgs,
} from './utils'

/**
 * @param options
 * @param context
 * @returns
 */
export default async function runExecutor(
  options: CliExecutorSchema & { [key: string]: unknown },
  context: Pick<ExecutorContext, 'root'>,
) {
  logger.info('Starting Executor...')
  const normalizedOptions = await normalizeOptions(options, context)
  if (!normalizedOptions.args.project) return { success: false }

  const stringifiedArgs = stringifyFirebaseArgs(
    normalizedOptions._[0],
    normalizedOptions.args,
  )

  //:TODO remove
  if (normalizedOptions._[0].includes('emulators')) {
    if (isString(normalizedOptions.args.only)) {
      if (normalizedOptions.args.only.includes('auth')) {
        process.env.NX_REACT_APP_AUTH_EMULATOR = 'true'
      }
      if (normalizedOptions.args.only.includes('functions')) {
        process.env.NX_REACT_APP_FUNCTIONS_EMULATOR = 'true'
      }
      if (normalizedOptions.args.only.includes('firestore')) {
        process.env.NX_REACT_APP_FIRESTORE_EMULATOR = 'true'
      }
      if (normalizedOptions.args.only.includes('storage')) {
        process.env.NX_REACT_APP_STORAGE_EMULATOR = 'true'
      }
    } else {
      process.env.NX_REACT_APP_AUTH_EMULATOR = 'true'
      process.env.NX_REACT_APP_FUNCTIONS_EMULATOR = 'true'
      process.env.NX_REACT_APP_FIRESTORE_EMULATOR = 'true'
      process.env.NX_REACT_APP_STORAGE_EMULATOR = 'true'
    }
  }

  const command = ['firebase', ...normalizedOptions._, stringifiedArgs]
    .filter(Boolean)
    .join(' ')

  runCommands([command])
  return { success: true }
}
