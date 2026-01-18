// Disable the Nx daemon during unit tests
process.env.NX_DAEMON = 'false'

// Mock the project graph to prevent unit tests from depending on the
// actual Nx workspace structure. This is recommended by the Nx team
// to isolate unit tests and ensure repeatable results.
// See: https://github.com/nrwl/nx/blob/master/scripts/unit-test-setup.js
jest.doMock('@nx/devkit', () => ({
  ...jest.requireActual('@nx/devkit'),
  createProjectGraphAsync: jest.fn().mockImplementation(async () => {
    return {
      nodes: {},
      dependencies: {},
    }
  }),
}))
