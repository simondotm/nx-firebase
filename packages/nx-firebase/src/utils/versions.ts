import { packageVersions } from '../__generated__/nx-firebase-versions'

// Declare target version of Nx that the plugin is currently compatible with
export const pluginNxVersion = `^${packageVersions.nx}`
export const pluginNxVersionMajor = parseInt(packageVersions.nx.split('.')[0])
