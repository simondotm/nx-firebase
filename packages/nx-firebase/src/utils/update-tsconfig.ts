import type { Tree } from '@nrwl/devkit'
import { joinPathFragments, updateJson } from '@nx/devkit'
import { tsConfigTarget } from '.'

/**
 * With firebase cli > 10.0.1 now compatible with node versions >=14 we can use es modules rather than commonjs
 *
 * @param tree
 * @param options
 */
export function updateTsConfig(tree: Tree, projectRoot: string): void {
  updateJson(
    tree,
    joinPathFragments(projectRoot, 'tsconfig.app.json'),
    (json) => {
      json.compilerOptions.emitDecoratorMetadata = true
      json.compilerOptions.target = tsConfigTarget
      return json
    },
  )
}
