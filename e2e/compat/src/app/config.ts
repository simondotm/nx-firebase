import { defaultCwd } from './utils/cwd'

// this is the package manager that will be used for the test Nx workspace
export const PACKAGE_MANAGER = 'pnpm'

// const CACHE_DIR = `${defaultCwd}/node_modules/.cache/nx-firebase`
export const CACHE_DIR = `${defaultCwd}/.nx-firebase`
// const CACHE_DIR = `${defaultCwd}/../.nx-firebase`