import { log } from './log'

/**
 * Test helper function approximating the Jest style of expect().toContain()
 * @param content
 * @param expected
 * @returns true if content contains expected string
 */
export function etc(content: string, expected: string) {
  return content.includes(expected)
}

export function expectToContain(content: string, expected: string | string[]) {
  if (Array.isArray(expected)) {
    for (const e in expected) {
      if (!etc(content, e)) {
        return false
      }
    }
    return true
  } else {
    return etc(content, expected)
  }
}

export function expectToNotContain(
  content: string,
  expected: string | string[],
) {
  return !expectToContain(content, expected)
}

// hacky jest-like tester
export async function it(testName: string, testFunc: () => Promise<void>) {
  log(` - ${testName}`)
  await testFunc()
}
