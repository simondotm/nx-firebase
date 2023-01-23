import { logger, readJsonFile, workspaceRoot } from '@nrwl/devkit'
import { pluginNxVersion, pluginNxVersionMajor } from './versions'

type PackageJson = {
  dependencies: {
    [packageName: string]: string
  }
  devDependencies: {
    [packageName: string]: string
  }
}

function readNxWorkspaceVersion(): string {
  // Check the runtime Nx version being used by the current workspace
  const semVerRegEx = /[~^]?([\dvx*]+(?:[-.](?:[\dx*]+|alpha|beta))*)/g
  const workspacePackage = readJsonFile<PackageJson>(
    `${workspaceRoot}/package.json`,
  )
  const workspaceNxPackageVersion = workspacePackage.devDependencies['nx']
  if (workspaceNxPackageVersion) {
    const workspaceNxVersion = workspaceNxPackageVersion.match(semVerRegEx)
    if (workspaceNxVersion.length) {
      return workspaceNxVersion[0]
    }
  }
  return ''
}

// determine the Nx version being used by the host workspace
export const workspaceNxVersion = readNxWorkspaceVersion()

export function checkNxVersion() {
  if (workspaceNxVersion) {
    if (!workspaceNxVersion.includes(pluginNxVersionMajor)) {
      logger.warn(
        `WARNING: @simondotm/nx-firebase plugin for Nx version (${pluginNxVersion}) may not be compatible with your version of Nx (${workspaceNxVersion})`,
      )
    }
  } else {
    logger.warn(
      `@simondotm/nx-firebase plugin could not determine your version of Nx. It may not be compatible.`,
    )
  }
}
