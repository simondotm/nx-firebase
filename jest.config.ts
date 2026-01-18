const { getJestProjects } = require('@nx/jest')

export default {
  projects: getJestProjects(),
  testEnvironment: 'node',
}
