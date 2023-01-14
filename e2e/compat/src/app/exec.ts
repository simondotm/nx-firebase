import { log } from './log'
import { exec } from 'child_process'

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
    log(`Executing command '${command}' in '${cwd}'`)
    const process = exec(command, { cwd: cwd }, (error, stdout, stderr) => {
      if (error) {
        console.warn(error.message)
        reject(error)
      }
      resolve({ stdout, stderr })
    })

    process.stdout.on('data', (data) => {
      log(data.toString())
    })

    process.stderr.on('data', (data) => {
      log(data.toString())
    })

    process.on('exit', (code) => {
      if (code) {
        log('child process exited with code ' + code.toString())
      }
    })
  })
}

export async function runNxCommandAsync(command: string, dir?: string) {
  const result = await customExec(`npx nx ${command} --verbose`, dir)
  return result
}
