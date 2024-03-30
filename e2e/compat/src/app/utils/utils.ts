import * as fs from 'fs'
// import { readJsonFile, writeJsonFile } from '@nx/devkit'
// import { exit } from 'process'
import { log } from './log'


/**
 * Set current working directory
 * @param dir
 */
export function setCwd(dir: string) {
  log(`Switching cwd to '${dir}'`)

  process.chdir(dir)

  log(`Switched cwd to '${process.cwd()}'`)
}

/**
 * Ensure given directory path exists, create if it doesn't
 * @param dir - directory path
 * @returns true if path already exists
 */
export function ensureDir(dir: string) {
  const pathExists = fs.existsSync(dir)
  if (!pathExists) {
    console.log(` - Creating dir '${dir}'...`)
    fs.mkdirSync(dir, { recursive: true })
  }
  return pathExists
}

export function fileExists(path: string) {
  return fs.existsSync(path)
}

export function deleteFile(path: string) {
  log(`deleting file '${path}'`)
  fs.rmSync(path)
}

export function deleteDir(path: string) {
  log(`deleting dir '${path}'`)
  fs.rmSync(path, { recursive: true, force: true })
}

/**
 * Replace content in file `path` that matches `match` with `addition`
 * @param path - path to the target text file
 * @param match - string to match in the index.ts
 * @param addition - string to add after the matched line in the index.ts
 */
export function addContentToTextFile(
  path: string,
  match: string,
  addition: string,
) {
  const content = fs.readFileSync(path, 'utf8')
  if (!content.includes(match)) {
    throw Error(
      `ERROR: addContentToTextFile: Could not find '${match}' in '${path}'`,
    )
  }
  const replaced = content.replace(match, `${match}\n${addition}`)
  fs.writeFileSync(path, replaced)
}

export function getFileSize(path: string) {
  const stats = fs.statSync(path)
  return stats.size
}
