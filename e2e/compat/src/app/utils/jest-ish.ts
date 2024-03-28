import { info } from 'console'
import { log, red } from './log'

/**
 * Test helper function approximating the Jest style of expect().toContain()
 * @param content
 * @param expected
 * @returns true if content contains expected string
 */
function etc(content: string, expected: string) {
  const pass = content.includes(expected)
  return pass
}

function expectToContainInner(content: string, expected: string | string[]) {
  if (Array.isArray(expected)) {
    for (const e of expected) {
      if (!etc(content, e)) {
        return false
      }
    }
    return true
  } else {
    return etc(content, expected)
  }
}

export function expectToContain(content: string, expected: string | string[]) {
  // log(`- expectToContain`)
  // log(`- content='${content}'`)
  // log(`- expected='${expected}'`)

  const pass = expectToContainInner(content, expected)
  if (!pass) {
    throw new Error(
      `TEST FAILED: expected '${expected}', received '${content}'`,
    )
  }
  return pass
}

export function expectToNotContain(
  content: string,
  expected: string | string[],
) {
  // log(`- expectToNotContain`)
  // log(`- content='${content}'`)
  // log(`- not expected='${expected}'`)

  const pass = !expectToContainInner(content, expected)
  if (!pass) {
    throw new Error(
      `TEST FAILED: not expected '${expected}', received '${content}'`,
    )
  }
  return pass
}

// hacky jest-like tester
export async function it(testName: string, testFunc: () => Promise<void>) {
  info(` - it ${testName}`)
  log(` - it ${testName}`)
  try {
    await testFunc()
  } catch (err) {
    info(red(err))
    throw err
  }
}
