import { execSync } from 'child_process'
import { platform } from 'os'
import { ExecutorContext, joinPathFragments, logger, readJsonFile } from '@nx/devkit'
import { KillEmulatorPortsExecutorSchema } from './schema.js'

export default async function runExecutor(
  options: KillEmulatorPortsExecutorSchema,
  context: ExecutorContext
) {
  const normalizedPath = joinPathFragments(context.root, options.config)
  const emulatorJson = readJsonFile(normalizedPath)

  const emulators = emulatorJson.emulators as Record<string, unknown>

  const emulatorPorts: number[] = []
  for (const entry of Object.entries(emulators)) {
    const value = entry[1]
    if (typeof value === 'object' && value && 'port' in value) {
      const port = Number(value.port)
      if (!isNaN(port)) emulatorPorts.push(port)
    }
  }

  const killFunc = platform() === 'win32' ? win32Kill : unixKill
  emulatorPorts.map(killFunc)

  return {
    success: true,
  }
}

function win32Kill(port: number) {
  logger.log(
    `${port} not killed... killing emulators through this method is not implemented for windows`
  )
}

function unixKill(port: number) {
  const pid = execSync(`lsof -t -i:${port} || echo ""`).toString().trim()
  if (!pid) {
    console.log(`no process running at port ${port}`)
    return
  }
  logger.log(`killing process at port ${port}...`)
  execSync(`kill -9 ${pid}`)
  logger.log(`killed process at port ${port}`)
}
