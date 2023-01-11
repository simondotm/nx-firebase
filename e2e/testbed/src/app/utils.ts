import { exec } from 'child_process'
import * as fs from 'fs'
import { readJsonFile, writeJsonFile } from '@nrwl/devkit'
import { exit } from 'process'

/**
 * Promisify node `exec`, with stdout & stderr piped to console
 * @param command
 * @param dir - defaults to cwd if not specified
 * @returns
 */
export async function customExec(
  command: string,
  dir?: string,
): Promise<{ stdout: string; stderr: string }> {
  const cwd = dir ? dir : process.cwd()
  return new Promise((resolve, reject) => {
    console.log(`Executing command '${command}' in '${cwd}'`)
    const process = exec(command, { cwd: cwd }, (error, stdout, stderr) => {
      if (error) {
        console.warn(error)
        reject(error)
      }
      resolve({ stdout, stderr })
    })

    process.stdout.on('data', (data) => {
      console.log(data.toString())
    })

    process.stderr.on('data', (data) => {
      console.log(data.toString())
    })

    process.on('exit', (code) => {
      if (code) {
        console.log('child process exited with code ' + code.toString())
      }
    })
  })
}

/**
 * Set current working directory
 * @param dir
 */
export function setCwd(dir: string) {
  console.log(`Switching cwd to '${dir}'`)

  process.chdir(dir)

  console.log(`Switched cwd to '${process.cwd()}'`)
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
  const replaced = content.replace(match, `${match}\n${addition}`)
  fs.writeFileSync(path, replaced)
}

/**
 * Test helper function approximating the Jest style of expect().toContain()
 * @param content
 * @param expected
 * @returns true if content contains expected string
 */
export function expectToContain(content: string, expected: string) {
  return content.includes(expected)
}
