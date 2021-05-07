// monkeypatch to ensure nx plugin e2e tests have the correct workspace for createProjectGraph()
// https://github.com/nrwl/nx/issues/5065
import * as path from 'path';
import * as fs from 'fs';
function patchAppRoot() : string {
    const cwd = process.cwd()
    const e2e = cwd.includes('nx-e2e')
    function pathInner(dir: string): string {
        if (process.env.NX_WORKSPACE_ROOT_PATH)
            return process.env.NX_WORKSPACE_ROOT_PATH;
        if (path.dirname(dir) === dir) return cwd;
        if (
            fs.existsSync(path.join(dir, 'workspace.json')) ||
            fs.existsSync(path.join(dir, 'angular.json'))
        ) {
            return dir;
        } else {
            return pathInner(path.dirname(dir));
        }
    }
    const appRoot = pathInner(cwd)

    console.log("cwd=" + cwd)
    console.log("is e2e=" + e2e)
    console.log("appRoot=" + appRoot)

    //only patch the workspace rootpath if we are running in an nx-e2e workspace path
    if (e2e) {
        process.env.NX_WORKSPACE_ROOT_PATH = appRoot
        console.log("e2e appRoot PATCHED from __dirname '" + __dirname + "' to '" + appRoot + "'")
    }
    return appRoot
}
export const e2eAppRoot = patchAppRoot()
