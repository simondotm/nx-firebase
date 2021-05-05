import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
} from '@nrwl/nx-plugin/testing';

jest.setTimeout(30000)

function expectedProjectFiles(root:string) {
    return [
        `${root}/src/index.ts`,
        `${root}/package.json`,
        `${root}/tsconfig.app.json`,
        `${root}/tsconfig.json`,
        `${root}/readme.md`,
        `${root}/database.rules.json`,
        `${root}/firestore.indexes.json`,
        `${root}/firestore.rules`,
        `${root}/storage.rules`,
    ]
}
function expectedTargetFiles(root:string) {
    return [
        `${root}/src/index.js`,
        `${root}/package.json`,
        `${root}/readme.md`,
    ]
}

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

            const plugin = 'nxfirebase-root-app' //uniq('nxfirebase-root-app');

            it('should create nxfirebase:application', async (done) => {
                //ensureNxProject('@simondotm/nxfirebase', 'dist/packages/nxfirebase');
                await runNxCommandAsync(
                    `generate @simondotm/nxfirebase:application ${plugin}`
                );
                done();
            });


            it('should create files in the specified application directory', async (done) => {
                expect(() =>
                    checkFilesExist(...expectedProjectFiles(`apps/${plugin}`)),
                ).not.toThrow();
                done();
            });

            it('should create a project firebase config in the workspace root directory', async (done) => {
                expect(() =>
                    checkFilesExist(
                        `${plugin}.firebase.json`,
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
                    checkFilesExist(...expectedTargetFiles(`dist/apps/${plugin}`)),
                ).not.toThrow();
                done();
            });

        });

        describe('--directory', () => {
            it('should create files in the specified application directory', async (done) => {
                const plugin = 'nxfirebase-subdir-app' //uniq('nxfirebase-subdir-app');
                //ensureNxProject('@simondotm/nxfirebase', 'dist/packages/nxfirebase');
                await runNxCommandAsync(
                    `generate @simondotm/nxfirebase:application ${plugin} --directory subdir`
                );
                expect(() =>
                    checkFilesExist(...expectedProjectFiles(`apps/subdir/${plugin}`)),
                ).not.toThrow();
                done();
            });
        });

        describe('--tags', () => {
            it('should add tags to nx.json', async (done) => {
                const plugin = 'nxfirebase-root-app-tags' //uniq('nxfirebase-root-app-tags');
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
