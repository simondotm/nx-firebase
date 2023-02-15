import type { Tree } from '@nrwl/devkit'
import { joinPathFragments } from '@nrwl/devkit'
import type { NormalizedOptions } from '../schema'

/**
 * Delete unwanted files created by the node generator
 * @param tree
 * @param options
 */
export function deleteFiles(tree: Tree, options: NormalizedOptions): void {
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
    tree.delete(path)
  }
}
