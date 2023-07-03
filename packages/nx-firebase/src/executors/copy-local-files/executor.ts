import { copyFileSync, statSync } from 'fs'
import path from 'path'
import { ExecutorContext, joinPathFragments, logger } from '@nx/devkit'
import { CopyLocalFilesExecutorSchema } from './schema'

export default async function runExecutor(
  options: CopyLocalFilesExecutorSchema,
  context: ExecutorContext
) {
  const projectName = context.projectName
  if (!projectName) return { success: false }
  const projectRoot = context.workspace?.projects[projectName].root
  const projectRootPath = `${context.root}/${projectRoot}`
  const projectDistPath = `${context.root}/dist/${projectRoot}`

  for (const file of ['.env.local', '.secret.local']) {
    const fileFullPath = joinPathFragments(projectRootPath, file)
    if (fileExists(fileFullPath)) {
      copyFileSync(fileFullPath, joinPathFragments(projectDistPath, file))
    }
  }
  return {
    success: true,
  }
}

const fileExists = (path: string): boolean => {
  try {
    const isFile = statSync(path).isFile()
    if (!isFile) logger.warn(`'${path}' is not a file`)
    return isFile
  } catch (error) {
    logger.warn(error.message)
    return false
  }
}
