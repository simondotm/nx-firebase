import type { Tree } from '@nx/devkit'
import { joinPathFragments, updateJson } from '@nx/devkit'
import { packageVersions } from '../__generated__/nx-firebase-versions'

// https://stackoverflow.com/questions/59787574/typescript-tsconfig-settings-for-node-js-12

export const nodeEsVersion: Record<string, string> = {
  '12': 'es2019',
  '14': 'es2020',
  '16': 'es2020', // es2020 seems more preferred with node 16 than es2021
  '18': 'es2022',
  '20': 'es2022',
  '22': 'es2022',
}

/**
 * With firebase cli > 10.0.1 now compatible with node versions >=14 we can use
 * ES Modules rather than CommonJS
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

  /** */
}
