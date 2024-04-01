import { packageVersions } from '../__generated__/nx-firebase-versions'

// Declare target version of Nx that the plugin is currently compatible with
export const pluginNxVersion = `^${packageVersions.nx}`
export const pluginNxVersionMajor = parseInt(packageVersions.nx.split('.')[0])

// Target node 16 for all firebase projects now
export const firebaseNodeEngine = packageVersions.nodeEngine
export const firebaseNodeRuntime = `nodejs${firebaseNodeEngine}`

// https://stackoverflow.com/questions/59787574/typescript-tsconfig-settings-for-node-js-12

export const nodeEsVersion: Record<string, string> = {
  '12': 'es2019',
  '14': 'es2020',
  '16': 'es2020', // es2020 seems more preferred with node 16 than es2021
  '18': 'es2022',
  '20': 'es2022',
}

export const tsConfigTarget = nodeEsVersion[firebaseNodeEngine]

if (!tsConfigTarget) {
  throw new Error('Undefined tsConfigTarget')
}
