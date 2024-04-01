import { defaultCwd } from './utils/cwd'

// this is the package manager that will be used for the test Nx workspace
export type PackageManager = 'npm' | 'yarn' | 'pnpm'
export const PACKAGE_MANAGER: PackageManager = 'pnpm'

// const CACHE_DIR = `${defaultCwd}/node_modules/.cache/nx-firebase`
export const CACHE_DIR = `${defaultCwd}/.nx-firebase`
// const CACHE_DIR = `${defaultCwd}/../.nx-firebase`
