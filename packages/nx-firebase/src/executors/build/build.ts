import '../../utils/e2ePatch' // intentional side effects
import { ExecutorContext, logger } from '@nrwl/devkit'
import type { ExecutorOptions } from '@nrwl/js/src/utils/schema'
import { tscExecutor } from '@nrwl/js/src/executors/tsc/tsc.impl'
import { firebaseBuildExecutor } from './lib'
import { checkNxVersion } from '../../utils'

/**
 * @simondotm/nx-firebase:build executor is a
 *  customized version of @nrwl/js:tsc executor
 */
export async function* runExecutor(
  options: ExecutorOptions,
  context: ExecutorContext,
) {
  checkNxVersion()

  if (process.env.NX_WORKSPACE_ROOT_PATH) {
    logger.warn(
      `WARNING: @simondotm/nx-firebase plugin is located outside this workspace, NX_WORKSPACE_ROOT_PATH has been set to ${process.env.NX_WORKSPACE_ROOT_PATH}`,
    )
  }

  /*
  // --updateBuildableProjectDepsInPackageJson is true by default for @nrwl/js:tsc
  // https://nx.dev/packages/js/executors/tsc
  // but we havent programmed our executor schema to match yet, so hack them in here.
  const customOptions: ExecutorOptions = {
    ...options,
    updateBuildableProjectDepsInPackageJson: true,
    clean: true,
  }
  */
  if (process.env.NX_VERBOSE_LOGGING) {
    logger.info(`options=${JSON.stringify(options, null, 3)}`)
  }

  console.log(`NX_WORKSPACE_ROOT_PATH=${process.env.NX_WORKSPACE_ROOT_PATH}`)

  // // SM: recompute the project graph on every iteration so that --watch will work,
  // //  since the context.projectGraph is only a snapshot
  // //const projectGraph = await createProjectGraphAsync()

  // iterate the tscExecutor generator until it completes
  // this approach allows us to add a custom post-compile process.
  //
  // with --watch enabled, this loop will run until the process terminates
  // https://github.com/nrwl/nx/blob/8bfc0b5527e3ea3acd14e4a11254505f02046d98/packages/js/src/executors/tsc/tsc.impl.ts#L176
  for await (const output of tscExecutor(options, context)) {
    // logger.info(output)
    if (output.success) {
      // Post-process Firebase Functions dependencies if compilation succeeded
      await firebaseBuildExecutor(context, options.outputPath)
    }
    yield output
  }
}

//SM: no idea what this shenanigans is for
//export default convertNxExecutor(runExecutor);
export default runExecutor
