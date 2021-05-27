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
jest.setTimeout(120000)


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
            ensureNxProject('@simondotm/nx-firebase', 'dist/packages/nx-firebase');
            done();
        });

    });


    //-----------------------------------------------------------------------------------------------
    // test init generator
    //-----------------------------------------------------------------------------------------------
    describe('nxfirebase init generator', () => {
        it('should init nxfirebase plugin', async (done) => {
            await runNxCommandAsync(
                `generate @simondotm/nx-firebase:init`
            );

            done();
        });
    });

    //-----------------------------------------------------------------------------------------------
    // test application generator
    //-----------------------------------------------------------------------------------------------
    const appProject = 'nxfirebase-root-app' //uniq('nxfirebase-root-app');
    describe('nxfirebase application generator', () => {

        describe('firebase app', () => {


            it('should create nxfirebase:application', async (done) => {
                //ensureNxProject('@simondotm/nx-firebase', 'dist/packages/nx-firebase');
                await runNxCommandAsync(
                    `generate @simondotm/nx-firebase:application ${appProject}`
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
                //ensureNxProject('@simondotm/nx-firebase', 'dist/packages/nx-firebase');
                const result = await runNxCommandAsync(
                    `generate @simondotm/nx-firebase:application ${plugin} --directory subdir`
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
                //ensureNxProject('-', 'dist/packages/nx-firebase');
                const result = await runNxCommandAsync(
                    `generate @simondotm/nx-firebase:application ${plugin} --tags e2etag,e2ePackage`
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




    const indexTs = `apps/${appProject}/src/index.ts`
    const indexTsFile = readFile(indexTs)
    let latestWorkingIndexTsFile = indexTsFile
    const importMatch = `import * as functions from 'firebase-functions';`

    /**
     * Replace content in the application `index.ts` that matches `importMatch` with `importAddition`
     * @param match - string to match in the index.ts
     * @param addition - string to add after the matched line in the index.ts
     */
    function addContentToIndexTs(match:string, addition:string) {
        updateFile(indexTs, (content:string) => {
            const replaced = content.replace(
                importMatch, 
                `${match}\n${addition}`);
            return replaced

        });
    }

    /**
     * Restore the application index.ts to initial state
     */
    function resetIndexTs() {
        updateFile(indexTs, (content:string) => {
            return latestWorkingIndexTsFile;
        });
    }

    //-----------------------------------------------------------------------------------------------
    // test we can import a library in the workspace
    //-----------------------------------------------------------------------------------------------
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
            const importAddition = `import * as c from '@proj/${libProject}'\nconsole.log(c.nodelib())\n`
            expect(indexTsFile).toContain(importMatch);
            addContentToIndexTs(importMatch, importAddition);
            expect(readFile(indexTs)).toContain(importAddition);
            done();
        });


        // rebuild app with deps
        it('should build nxfirebase:app', async (done) => {
            const result = await runNxCommandAsync(`build ${appProject} --with-deps`);
            expect(result.stdout).toContain('Done compiling TypeScript files');
            done();
        });

    });



    //-----------------------------------------------------------------------------------------------
    // test that application can import a library from a subdir in the workspace
    // this uses --importPath
    //-----------------------------------------------------------------------------------------------
    describe('nxfirebase generate subdir nodelibrary using --importPath', () => {


        const libProject = 'nodelib' //uniq('nxfirebase-functions-app');
        const subDir = 'subdir'
        it('should create subdir-nodelib', async (done) => {
            await runNxCommandAsync(
                `generate @nrwl/node:lib ${libProject} --directory ${subDir} --buildable --importPath='@proj/${subDir}-${libProject}'`
            );

            done();
        });

        // add our new subdir-nodelib as an imported dependency
        it('should add subdir-nodelib as an index.ts dependency', async (done) => {
            const importAddition = `import * as d from '@proj/${subDir}-${libProject}'\nconsole.log(d.subdirNodelib())\n`
            const inFile = readFile(indexTs)
            expect(inFile).toContain(importMatch);
            latestWorkingIndexTsFile = inFile

            addContentToIndexTs(importMatch, importAddition);

            expect(readFile(indexTs)).toContain(importAddition);
            done();
        });


        // rebuild app with deps
        it('should build nxfirebase:app', async (done) => {
            const result = await runNxCommandAsync(`build ${appProject} --with-deps`);
            expect(result.stdout).toContain('Done compiling TypeScript files');
            done();
        });

    });









    //-----------------------------------------------------------------------------------------------
    // test that the builder detects non-buildable libraries
    //-----------------------------------------------------------------------------------------------
    describe('nxfirebase generate non-buildable nodelibrary', () => {


        const libProject = 'nonbuildablenodelib' //uniq('nxfirebase-functions-app');
        it('should create nonbuildablenodelib', async (done) => {
            await runNxCommandAsync(
                `generate @nrwl/node:lib ${libProject}`
            );

            done();
        });

        // add our new nonbuildablenodelib as an imported dependency
        it('should add nonbuildablenodelib as an index.ts dependency', async (done) => {
            const importAddition = `import * as e from '@proj/${libProject}'\nconsole.log(e.nonbuildablenodelib())\n`
            const inFile = readFile(indexTs)
            expect(inFile).toContain(importMatch);

            addContentToIndexTs(importMatch, importAddition);

            expect(readFile(indexTs)).toContain(importAddition);
            done();
        });


        // rebuild app with deps - should throw an error because the library is not buildable
        it('should not build nxfirebase:app due to non buildable library', async (done) => {
            const result = await runNxCommandAsync(`build ${appProject} --with-deps`, { silenceError: true });
            expect(result.stdout).toContain('ERROR: Found non-buildable library');
            expect(result.stderr).toContain('Firebase Application contains references to non-buildable');
            done();
        });

    });


    //-----------------------------------------------------------------------------------------------
    // reset the build to be buildable again
    //-----------------------------------------------------------------------------------------------
/*
    describe('reset application to last working buildable state', () => {
        it('should reset index.ts', async (done) => {
            resetIndexTs();
            expect(readFile(indexTs)).toEqual(latestWorkingIndexTsFile);
            done();
        });
    });
*/

    //-----------------------------------------------------------------------------------------------
    // now try and create a subdir library without --importPath
    // the app builder should warning about this
    //-----------------------------------------------------------------------------------------------

    describe('nxfirebase generate subdir nodelibrary without --importPath', () => {


        const libProject = 'nodelib2'
        const subDir = 'subdir'
        it('should create subdir-nodelib2', async (done) => {
            await runNxCommandAsync(
                `generate @nrwl/node:lib ${libProject} --directory ${subDir} --buildable`
            );

            done();
        });

        // add our new subdir-nodelib2 as an imported dependency
        it('should add subdir-nodelib2 as an index.ts dependency', async (done) => {
            const importAddition = `import * as f from '@proj/${subDir}/${libProject}'\nconsole.log(f.subdirNodelib2())\n`
            const inFile = readFile(indexTs)
            expect(inFile).toContain(importMatch);

            addContentToIndexTs(importMatch, importAddition);

            expect(readFile(indexTs)).toContain(importAddition);
            done();
        });


        // rebuild app with deps
        // should throw an error because the nested library is incompatible
        it('should not build nxfirebase:app due to incompatible nested library', async (done) => {
            const result = await runNxCommandAsync(`build ${appProject} --with-deps`, { silenceError: true });
            expect(result.stdout).toContain('ERROR: Found incompatible nested library');
            expect(result.stderr).toContain('Firebase Application contains references to non-buildable');
            done();
        });

    });


    // test functions generator
    /*
    describe('nxfirebase functions generator', () => {

        describe('functions schema', () => {

            const plugin = uniq('nxfirebase-functions-app');
            it('should create nxfirebase:functions', async (done) => {
                //ensureNxProject('@simondotm/nx-firebase', 'dist/packages/nx-firebase');
                await runNxCommandAsync(
                    `generate @simondotm/nx-firebase:functions ${plugin}`
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
                //ensureNxProject('@simondotm/nx-firebase', 'dist/packages/nx-firebase');
                await runNxCommandAsync(
                    `generate @simondotm/nx-firebase:functions ${plugin} --directory subdir`
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
                //ensureNxProject('@simondotm/nx-firebase', 'dist/packages/nx-firebase');
                await runNxCommandAsync(
                    `generate @simondotm/nx-firebase:functions ${plugin} --tags e2etag,e2ePackage`
                );
                const nxJson = readJson('nx.json');
                expect(nxJson.projects[plugin].tags).toEqual(['e2etag', 'e2ePackage']);
                done();
            });
        });

    });
    */

});
