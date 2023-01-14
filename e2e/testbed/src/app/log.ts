const ENABLE_LOG = false
const DEFAULT_LOG_FILE = `${process.cwd()}/e2e.log`

import * as fs from 'fs'

let LOG_FILE: string | undefined

export function setLogFile(path?: string) {
  LOG_FILE = path || DEFAULT_LOG_FILE
  fs.writeFileSync(LOG_FILE, '')
}

setLogFile()

export function log(msg: string) {
  if (ENABLE_LOG) {
    console.log(msg)
  }
  fs.appendFileSync(LOG_FILE, `${msg}\n`)
}

export function info(msg: string) {
  console.log(msg)
  fs.appendFileSync(LOG_FILE, `${msg}\n`)
}
