import type { Tree } from '@nrwl/devkit'
import { joinPathFragments, updateJson } from '@nrwl/devkit'
import { tsConfigTarget } from '.'
import type { NormalizedOptions } from '../generators/function/schema'

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
