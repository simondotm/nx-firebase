import type { Tree } from '@nrwl/devkit'
import { joinPathFragments, updateJson } from '@nx/devkit'
import { nodeEsVersion } from './versions'

/**
 * With firebase cli > 10.0.1 now compatible with node versions >=14 we can use es modules rather than commonjs
 *
 * @param tree
 * @param options
 */
export function updateTsConfig(
  tree: Tree,
  projectRoot: string,
  runTime: string,
  format: 'esm' | 'cjs',
): void {
  updateJson(
    tree,
    joinPathFragments(projectRoot, 'tsconfig.app.json'),
    (json) => {
      json.compilerOptions.target = nodeEsVersion[runTime]
      json.compilerOptions.module = format === 'esm' ? 'es2020' : 'commonjs'
      return json
    },
  )
}
