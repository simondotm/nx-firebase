const ENABLE_LOG = false
const DEFAULT_LOG_FILE = `${process.cwd()}/e2e.log`

import * as fs from 'fs'
import { ensureDir } from './utils'

let LOG_FILE: string | undefined

function writeLog(msg: string) {
  ensureDir(LOG_FILE)
  fs.appendFileSync(LOG_FILE, `${msg}\n`)
}

export function setLogFile(path?: string) {
  LOG_FILE = path || DEFAULT_LOG_FILE
  console.log(`Logging to '${LOG_FILE}'`)
  ensureDir(LOG_FILE)
  fs.writeFileSync(LOG_FILE, '') // reset log file
}

setLogFile()

export function log(msg: string) {
  if (ENABLE_LOG) {
    console.log(msg)
  }
  writeLog(msg)
}

export function info(msg: string) {
  console.log(msg)
  writeLog(msg)
  // fs.appendFileSync(LOG_FILE, `${msg}\n`)
}

export function time(ms: number) {
  return `${(ms / 1000.0).toFixed(1)}s`
}

// https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
const GREEN_FG = '\x1b[32m'
const RED_FG = '\x1b[31m'
const RESET_FG = '\x1b[0m'

export function green(text: string) {
  return `${GREEN_FG}${text}${RESET_FG}`
}
export function red(text: string) {
  return `${RED_FG}${text}${RESET_FG}`
}
