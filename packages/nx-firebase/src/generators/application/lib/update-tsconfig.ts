import type { Tree } from '@nrwl/devkit'
import { joinPathFragments, updateJson } from '@nrwl/devkit'
import type { NormalizedOptions } from '../schema'

/**
 * With firebase cli > 10.0.1 now compatible with node versions >=13 we can use es modules rather than commonjs
 *
 * @param tree
 * @param options
 */
export function updateTsConfig(tree: Tree, options: NormalizedOptions): void {
  updateJson(
    tree,
    joinPathFragments(options.appProjectRoot, 'tsconfig.app.json'),
    (json) => {
      json.compilerOptions.emitDecoratorMetadata = true
      json.compilerOptions.target = 'es2015'
      return json
    },
  )
}
