import { getProjectData } from './test-utils-project-data'

/**
 * Shared library data that persists across all e2e tests.
 * These libraries are created by test-libraries.spec.ts and used by other tests.
 */
export const buildableLibData = getProjectData('libs', 'buildablelib')
export const nonbuildableLibData = getProjectData('libs', 'nonbuildablelib')
export const subDirBuildableLibData = getProjectData('libs', 'buildablelib', {
  dir: 'subdir',
})
export const subDirNonbuildableLibData = getProjectData(
  'libs',
  'nonbuildablelib',
  { dir: 'subdir' },
)
