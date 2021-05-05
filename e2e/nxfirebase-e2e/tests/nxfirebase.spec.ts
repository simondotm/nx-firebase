import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

jest.setTimeout(30000)


describe('nxfirebase e2e', () => {

    describe('nxfirebase plugin', () => {
        it('should install correctly', async (done) => {
            ensureNxProject('@simondotm/nxfirebase', 'dist/packages/nxfirebase');
            done();
        });

    });


    // test init generator
    describe('nxfirebase init generator', () => {
        it('should init nxfirebase plugin', async (done) => {
            await runNxCommandAsync(
                `generate @simondotm/nxfirebase:init`
            );

            done();
        });
    });

    // test application generator
    describe('nxfirebase application generator', () => {

        describe('firebase app', () => {

            const plugin = uniq('nxfirebase-root-app');

            it('should create nxfirebase:application', async (done) => {
                //ensureNxProject('@simondotm/nxfirebase', 'dist/packages/nxfirebase');
                await runNxCommandAsync(
                    `generate @simondotm/nxfirebase:application ${plugin}`
                );
                done();
            });


            it('should create files in the specified application directory', async (done) => {
                expect(() =>
                    checkFilesExist(
                        `apps/${plugin}/src/index.ts`,
                        `apps/${plugin}/package.json`,
                        `apps/${plugin}/tsconfig.app.json`,
                        `apps/${plugin}/tsconfig.json`,
                        `apps/${plugin}/readme.md`,
                        `apps/${plugin}/firebase.json`,
                    ),
                ).not.toThrow();
                done();
            });

            it('should build nxfirebase:app', async (done) => {
                const result = await runNxCommandAsync(`build ${plugin}`);
                expect(result.stdout).toContain('Done compiling TypeScript files');
                done();
            });

            it('should compile files to the specified dist directory', async (done) => {
                expect(() =>
                    checkFilesExist(
                        `dist/apps/${plugin}/src/index.js`,
                        `dist/apps/${plugin}/package.json`,
                        `dist/apps/${plugin}/readme.md`,
                        `dist/apps/${plugin}/firebase.json`,
                    ),
                ).not.toThrow();
                done();
            });

        });

        describe('--directory', () => {
            it('should create files in the specified application directory', async (done) => {
                const plugin = uniq('nxfirebase-subdir-app');
                //ensureNxProject('@simondotm/nxfirebase', 'dist/packages/nxfirebase');
                await runNxCommandAsync(
                    `generate @simondotm/nxfirebase:application ${plugin} --directory subdir`
                );
                expect(() =>
                    checkFilesExist(`apps/subdir/${plugin}/firebase.json`, `apps/subdir/${plugin}/readme.md`),
                ).not.toThrow();
                done();
            });
        });

        describe('--tags', () => {
            it('should add tags to nx.json', async (done) => {
                const plugin = uniq('nxfirebase-root-app-tags');
                //ensureNxProject('@simondotm/nxfirebase', 'dist/packages/nxfirebase');
                await runNxCommandAsync(
                    `generate @simondotm/nxfirebase:application ${plugin} --tags e2etag,e2ePackage`
                );
                const nxJson = readJson('nx.json');
                expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);
                done();
            });
        });
    })


    // test functions generator
    /*
    describe('nxfirebase functions generator', () => {

        describe('functions schema', () => {

            const plugin = uniq('nxfirebase-functions-app');
            it('should create nxfirebase:functions', async (done) => {
                //ensureNxProject('@simondotm/nxfirebase', 'dist/packages/nxfirebase');
                await runNxCommandAsync(
                    `generate @simondotm/nxfirebase:functions ${plugin}`
                );

                done();
            });

            it('should build nxfirebase:functions', async (done) => {

                const result = await runNxCommandAsync(`build ${plugin}`);
                expect(result.stdout).toContain('Done compiling TypeScript files for library');

                done();
            });
        });

        describe('--directory', () => {
            it('should create src/index.ts & package.json in the specified functions directory', async (done) => {
                const plugin = uniq('nxfirebase-functions-app');
                //ensureNxProject('@simondotm/nxfirebase', 'dist/packages/nxfirebase');
                await runNxCommandAsync(
                    `generate @simondotm/nxfirebase:functions ${plugin} --directory subdir`
                );
                expect(() =>
                    checkFilesExist(`apps/subdir/${plugin}/src/index.ts`, `apps/subdir/${plugin}/package.json`),
                ).not.toThrow();
                done();
            });
        });

        describe('--tags', () => {
            it('should add tags to nx.json', async (done) => {
                const plugin = uniq('nxfirebase');
                //ensureNxProject('@simondotm/nxfirebase', 'dist/packages/nxfirebase');
                await runNxCommandAsync(
                    `generate @simondotm/nxfirebase:functions ${plugin} --tags e2etag,e2ePackage`
                );
                const nxJson = readJson('nx.json');
                expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);
                done();
            });
        });

    });
    */

});
