const ENABLE_LOG = false
const LOG_FILE = `${process.cwd()}/e2e.log`

import * as fs from 'fs'

fs.writeFileSync(LOG_FILE, '')

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
