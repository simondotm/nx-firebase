import { ExecutorContext } from '@nrwl/devkit'
import type { ExecutorOptions } from '@nrwl/js/src/utils/schema'
import { tscExecutor } from '@nrwl/js/src/executors/tsc/tsc.impl'
import { updateFirebaseDependencies } from './lib'

/**
 * @simondotm/nx-firebase:build executor is a
 *  customized version of @nrwl/js:tsc executor
 */
export async function* runExecutor(
  options: ExecutorOptions,
  context: ExecutorContext,
) {
  // iterate the tscExecutor generator until it completes
  // this approach allows us to add a custom post-compile process
  // with --watch enabled, this will when the process terminates
  // https://github.com/nrwl/nx/blob/8bfc0b5527e3ea3acd14e4a11254505f02046d98/packages/js/src/executors/tsc/tsc.impl.ts#L176
  for await (const output of tscExecutor(options, context)) {
    if (output.success) {
      // Process Firebase Functions dependencies
      await updateFirebaseDependencies(context, options.outputPath)
    }
    yield output
  }
}
//export default convertNxExecutor(runExecutor);

export default runExecutor
