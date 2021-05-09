import {
  checkFilesExist,
  ensureNxProject,
  readJson,
  runNxCommandAsync,
  uniq,
  updateFile,
  readFile
  
} from '@nrwl/nx-plugin/testing';

// default 5000 is not long enough for some of our tests.
jest.setTimeout(60000)


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
    const appProject = 'nxfirebase-root-app' //uniq('nxfirebase-root-app');
    describe('nxfirebase application generator', () => {

        describe('firebase app', () => {


            it('should create nxfirebase:application', async (done) => {
                //ensureNxProject('@simondotm/nxfirebase', 'dist/packages/nxfirebase');
                await runNxCommandAsync(
                    `generate @simondotm/nxfirebase:application ${appProject}`
                );
                done();
            });


            it('should create files in the specified application directory', async (done) => {
                expect(() =>
                    checkFilesExist(...expectedProjectFiles(`apps/${appProject}`)),
                ).not.toThrow();
                done();
            });

            it('should create a project firebase config in the workspace root directory', async (done) => {
                expect(() =>
                    checkFilesExist(
                        `firebase.${appProject}.json`,
                        `.firebaserc`,
                        `firebase.json`,
                    ),
                ).not.toThrow();
                done();
            });


            it('should build nxfirebase:app', async (done) => {
                const result = await runNxCommandAsync(`build ${appProject}`);
                expect(result.stdout).toContain('Done compiling TypeScript files');
                done();
            });

            it('should compile files to the specified dist directory', async (done) => {
                expect(() =>
                    checkFilesExist(...expectedTargetFiles(`dist/apps/${appProject}`)),
                ).not.toThrow();
                done();
            });

        });

        describe('--directory', () => {
            it('should create files in the specified application directory', async (done) => {
                const plugin = 'nxfirebase-subdir-app' //uniq('nxfirebase-subdir-app');
                //ensureNxProject('@simondotm/nxfirebase', 'dist/packages/nxfirebase');
                const result = await runNxCommandAsync(
                    `generate @simondotm/nxfirebase:application ${plugin} --directory subdir`
                );
                expect(() =>
                    checkFilesExist(...expectedProjectFiles(`apps/subdir/${plugin}`)),
                ).not.toThrow();

                // creating the second firebase app should not overwrite the existing .firebaserc and firebase.json files
                expect(result.stdout).toContain('firebase.json already exists in this workspace');
                expect(result.stdout).toContain('.firebaserc already exists in this workspace');

                done();
            });




        });

        describe('--tags', () => {
            it('should add tags to nx.json', async (done) => {
                const plugin = 'nxfirebase-root-app-tags' //uniq('nxfirebase-root-app-tags');
                //ensureNxProject('@simondotm/nxfirebase', 'dist/packages/nxfirebase');
                const result = await runNxCommandAsync(
                    `generate @simondotm/nxfirebase:application ${plugin} --tags e2etag,e2ePackage`
                );
                const nxJson = readJson('nx.json');
                expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);

                // creating the third firebase app should also not overwrite the existing .firebaserc and firebase.json files
                expect(result.stdout).toContain('firebase.json already exists in this workspace');
                expect(result.stdout).toContain('.firebaserc already exists in this workspace');

                done();
            });
        });
    })

    // test we can import a library in the workspace
    describe('nxfirebase generate nodelibrary', () => {


        const libProject = 'nodelib' //uniq('nxfirebase-functions-app');
        it('should create nodelib', async (done) => {
            await runNxCommandAsync(
                `generate @nrwl/node:lib ${libProject} --buildable`
            );

            done();
        });

        // add our new nodelib as an imported dependency
        it('should add nodelib as an index.ts dependency', async (done) => {
            const indexTs = `apps/${appProject}/src/index.ts`
            const importMatch = `import * as functions from 'firebase-functions';`
            const importAddition = `import * as c from '@proj/${libProject}'\nconsole.log(c.nodelib())\n`
            const inFile = readFile(indexTs)
            expect(inFile).toContain(importMatch);

            updateFile(indexTs, (content:string) => {
                const replaced = content.replace(
                    importMatch, 
                    `${importMatch}\n${importAddition}`);
                return replaced

            });

            const outFile = readFile(indexTs)
            expect(outFile).toContain(importAddition);
            done();
        });


        // rebuild app with deps
        it('should build nxfirebase:app', async (done) => {
            const result = await runNxCommandAsync(`build ${appProject} --with-deps`);
            expect(result.stdout).toContain('Done compiling TypeScript files');
            done();
        });

    });



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
