import { type Tree, joinPathFragments, updateJson } from '@nx/devkit'
import { packageVersions } from '../__generated__/nx-firebase-versions'

// https://stackoverflow.com/questions/59787574/typescript-tsconfig-settings-for-node-js-12

export const nodeEsVersion: Record<string, string> = {
  '18': 'es2022',
  '20': 'es2022',
  '22': 'es2023',
  '24': 'es2024',
}

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
  const tsConfigTarget =
    nodeEsVersion[runTime] ?? nodeEsVersion[packageVersions.nodeEngine]
  updateJson(
    tree,
    joinPathFragments(projectRoot, 'tsconfig.app.json'),
    (json) => {
      json.compilerOptions.target = tsConfigTarget
      json.compilerOptions.module = format === 'esm' ? 'es2020' : 'commonjs'
      return json
    },
  )
}
