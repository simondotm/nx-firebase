/*
// e2e patch from old nx-firebase plugin
// monkeypatch to ensure nx plugin e2e tests have the correct workspace for createProjectGraph()
// https://github.com/nrwl/nx/issues/5065
import * as path from 'path'
import * as fs from 'fs'
function patchAppRoot(): string {
  const cwd = process.cwd()
  const e2e = cwd.includes('nx-e2e')
  function pathInner(dir: string): string {
    if (process.env.NX_WORKSPACE_ROOT_PATH)
      return process.env.NX_WORKSPACE_ROOT_PATH
    if (path.dirname(dir) === dir) return cwd
    if (
      fs.existsSync(path.join(dir, 'workspace.json')) ||
      fs.existsSync(path.join(dir, 'angular.json'))
    ) {
      return dir
    } else {
      return pathInner(path.dirname(dir))
    }
  }
  const appRoot = pathInner(cwd)

  //console.log("cwd=" + cwd)
  //console.log("is e2e=" + e2e)
  //console.log("appRoot=" + appRoot)

  //only patch the workspace rootpath if we are running in an nx-e2e workspace path
  if (e2e) {
    process.env.NX_WORKSPACE_ROOT_PATH = appRoot
    console.log(
      "e2e appRoot PATCHED from __dirname '" +
        __dirname +
        "' to '" +
        appRoot +
        "'",
    )
  }
  return appRoot
}
export const e2eAppRoot = patchAppRoot()
*/

// NEEDED FOR NX13 ONLY - FIXED AT SOMEPOINT FROM 14.x to 15.x
// monkeypatch to ensure nx plugin e2e tests have the correct workspace for createProjectGraph()
// https://github.com/nrwl/nx/issues/5065
import * as path from 'path'
import * as fs from 'fs'
import { statSync } from 'fs'

// import { logger, readJsonFile } from '@nx/devkit'

// from https://github.com/nrwl/nx/blob/803d5ff126d20d1116d3a505233ddf7d971688d6/packages/nx/src/utils/app-root.ts#L9
export function fileExists(filePath: string): boolean {
  try {
    return statSync(filePath).isFile()
  } catch (err) {
    return false
  }
}

// this function determines the current workspace root
// it unwraps 'dir' until it reaches an nx workspace root.
// OR, if NX_WORKSPACE_ROOT_PATH environment var is defined, it will use that instead.
function pathInner(dir: string): string {
  if (process.env.NX_WORKSPACE_ROOT_PATH)
    return process.env.NX_WORKSPACE_ROOT_PATH
  //   console.log(`pathInner(${dir})`)
  if (path.dirname(dir) === dir) return process.cwd()
  //   console.log(`not returning cwd, checking next level`)
  if (
    fileExists(path.join(dir, 'workspace.json')) ||
    fileExists(path.join(dir, 'nx.json')) ||
    fileExists(path.join(dir, 'angular.json'))
  ) {
    // console.log(`found root, returning dir=${dir}`)
    return dir
  } else {
    // console.log(`not found root, recursing on dir=${dir}`)
    return pathInner(path.dirname(dir))
  }
}

// function patchAppRoot(): string {
//   const cwd = process.cwd()
//   console.log('NX_WORKSPACE_ROOT_PATH=' + process.env.NX_WORKSPACE_ROOT_PATH)
//   console.log(`cwd=${cwd}`)
//   const appRootPath = pathInner(__dirname)

//   console.log('--------')

//   // determine if plugin is being run from somewhere other than cwd
//   const needsPatching = pathInner(cwd) !== pathInner(__dirname)
//   const e2e = cwd.includes('nx-e2e')

//   // for our patch, we are using cwd instead of __dirname
//   const appRoot = pathInner(cwd)

//   //needsPatching patch the workspace rootpath if we are running in an nx-e2e workspace path
//   if (e2e) {
//     //needsPatching) {
//     console.log('cwd=' + cwd)
//     console.log('is e2e=' + e2e)
//     console.log('appRoot=' + appRoot)

//     process.env.NX_WORKSPACE_ROOT_PATH = appRoot
//     console.log(
//       "appRoot PATCHED from __dirname '" + __dirname + "' to '" + appRoot + "'",
//     )
//   }
//   return appRoot
// }

function patchAppRoot(): string {
  let appRoot = process.env.NX_WORKSPACE_ROOT_PATH

  if (!appRoot) {
    const cwd = process.cwd()
    // console.log('NX_WORKSPACE_ROOT_PATH=' + process.env.NX_WORKSPACE_ROOT_PATH)
    // console.log(`cwd=${cwd}`)
    const pluginAppRootPath = pathInner(__dirname)
    const cwdAppRootPath = pathInner(cwd)
    // console.log('--------')

    if (pluginAppRootPath !== cwdAppRootPath) {
      // plugin is located in a different workspace, so patch the NX_WORKSPACE_ROOT_PATH
      appRoot = cwdAppRootPath
      process.env.NX_WORKSPACE_ROOT_PATH = appRoot
      //   logger.warn(
      //     `WARNING: @simondotm/nx-firebase plugin is located outside this workspace, NX_WORKSPACE_ROOT_PATH has been set to ${appRoot}`,
      //   )
    } else {
      appRoot = pluginAppRootPath
    }
  } else {
    // logger.warn(`NX_WORKSPACE_ROOT_PATH is set to ${appRoot}`)
  }

  return appRoot
}

export const e2eAppRoot = patchAppRoot()
