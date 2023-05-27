// Declare target version of Nx that the plugin is currently compatible with
export const pluginNxVersion = '^16.1.1'
export const pluginNxVersionMajor = 16

// Tslib version changes with each Nx version
export const tsLibVersion = '^2.0.0'

// Firebase packages are not managed by the plugin
// but they are added if they do not exist already in the workspace
export const firebaseAdminVersion = '^11.3.0'
export const firebaseFunctionsVersion = '^4.1.0'
export const firebaseToolsVersion = '^11.16.1'
export const firebaseVersion = '^9.14.0'
export const firebaseFunctionsTestVersion = '^0.2.0'

// Target node 16 for all firebase projects now
export const firebaseNodeEngine = '16'
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

// kill-port is used by the emulator/serve target
export const killportVersion = '^2.0.1'
