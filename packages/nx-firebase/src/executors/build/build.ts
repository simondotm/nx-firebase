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

import { BuildExecutorSchema } from './schema'

export default async function runExecutor(options: BuildExecutorSchema) {
  console.log('Executor ran for Build', options)
  return {
    success: true,
  }
}
