const ENABLE_TEST_DEBUG_INFO = true

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

export function testDebug(info: string) {
  if (ENABLE_TEST_DEBUG_INFO) {
    console.debug(info)
  }
}
