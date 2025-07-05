import type { Tree } from '@nx/devkit'
import { joinPathFragments } from '@nx/devkit'
import type { FunctionGeneratorNormalizedSchema } from '../schema'

/**
 * Delete unwanted files created by the node generator
 * @param host
 * @param options
 */
export function deleteFiles(
  host: Tree,
  options: FunctionGeneratorNormalizedSchema,
): void {
  const nodeFilesToDelete = [
    joinPathFragments(options.projectRoot, 'src', 'main.ts'),
    joinPathFragments(options.projectRoot, 'src', 'app', '.gitkeep'),
    joinPathFragments(options.projectRoot, 'src', 'assets', '.gitkeep'),
    joinPathFragments(
      options.projectRoot,
      'src',
      'environments',
      'environment.prod.ts',
    ),
    joinPathFragments(
      options.projectRoot,
      'src',
      'environments',
      'environment.ts',
    ),
  ]

  for (const path of nodeFilesToDelete) {
    host.delete(path)
  }
}
