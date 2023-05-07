import type { Tree } from '@nx/devkit'
import { joinPathFragments, updateJson } from '@nx/devkit'
import { tsConfigTarget } from '../../../utils'
import type { NormalizedOptions } from '../schema'

/**
 * With firebase cli > 10.0.1 now compatible with node versions >=14 we can use es modules rather than commonjs
 *
 * @param tree
 * @param options
 */
export function updateTsConfig(tree: Tree, options: NormalizedOptions): void {
  updateJson(
    tree,
    joinPathFragments(options.projectRoot, 'tsconfig.app.json'),
    (json) => {
      json.compilerOptions.emitDecoratorMetadata = true
      json.compilerOptions.target = tsConfigTarget
      return json
    },
  )
}
