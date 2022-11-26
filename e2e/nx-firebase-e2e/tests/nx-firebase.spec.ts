import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

const JEST_TIMEOUT = 120000;

describe('nx-firebase e2e', () => {
  // Setting up individual workspaces per
  // test can cause e2e runs to take a long time.
  // For this reason, we recommend each suite only
  // consumes 1 workspace. The tests should each operate
  // on a unique project in the workspace, such that they
  // are not dependant on one another.
  beforeAll(() => {
    ensureNxProject('@simondotm/nx-firebase', 'dist/packages/nx-firebase');
  });

  afterAll(() => {
    // `nx reset` kills the daemon, and performs
    // some work which can help clean up e2e leftovers
    runNxCommandAsync('reset');
  });

  it('should create nx-firebase', async () => {
    const project = uniq('nx-firebase');
    await runNxCommandAsync(
      `generate @simondotm/nx-firebase:nx-firebase ${project}`
    );
    const result = await runNxCommandAsync(`build ${project}`);
    expect(result.stdout).toContain('Executor ran');
  }, JEST_TIMEOUT);

  describe('--directory', () => {
    it('should create src in the specified directory', async () => {
      const project = uniq('nx-firebase');
      await runNxCommandAsync(
        `generate @simondotm/nx-firebase:nx-firebase ${project} --directory subdir`
      );
      expect(() =>
        checkFilesExist(`libs/subdir/${project}/src/index.ts`)
      ).not.toThrow();
    }, JEST_TIMEOUT);
  });

  describe('--tags', () => {
    it('should add tags to the project', async () => {
      const projectName = uniq('nx-firebase');
      ensureNxProject('@simondotm/nx-firebase', 'dist/packages/nx-firebase');
      await runNxCommandAsync(
        `generate @simondotm/nx-firebase:nx-firebase ${projectName} --tags e2etag,e2ePackage`
      );
      const project = readJson(`libs/${projectName}/project.json`);
      expect(project.tags).toEqual(['e2etag', 'e2ePackage']);
    }, JEST_TIMEOUT);
  });
});
