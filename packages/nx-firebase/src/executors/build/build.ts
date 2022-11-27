import { ExecutorContext, logger } from '@nrwl/devkit'
import type { ExecutorOptions } from '@nrwl/js/src/utils/schema'
import { tscExecutor as jsTscExecutor } from '@nrwl/js/src/executors/tsc/tsc.impl'

export async function* runExecutor(
  options: ExecutorOptions,
  context: ExecutorContext,
) {
  logger.log('running our custom build executor')
  yield* jsTscExecutor(options, context)
  logger.log('post yield from jsTscExecutor in our custom build executor')
}

//export default convertNxExecutor(runExecutor);

export default runExecutor

/*
import { ExecutorContext } from '@nrwl/devkit'
import type { NodeExecutorOptions } from '@nrwl/js/src/executors/node/schema'
import { nodeExecutor as jsNodeExecutor } from '@nrwl/js/src/executors/node/node.impl'

export async function* runExecutor(
  options: NodeExecutorOptions,
  context: ExecutorContext,
) {
  yield* jsNodeExecutor(options, context)
}

//export default convertNxExecutor(runExecutor);

export default runExecutor
*/

/*
import { BuildExecutorSchema } from './schema'

export default async function runExecutor(options: BuildExecutorSchema) {
  console.log('Executor ran for Build', options)
  return {
    success: true,
  }
}
*/
