import { runNxCommandAsync } from './exec'
import { log } from './log'
import { addContentToTextFile } from './utils'

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

const npmContent = [
  `Added 'npm' dependency 'firebase-admin'`,
  `Added 'npm' dependency 'firebase-functions'`,
]

const libContent = [`Copied 'lib' dependency '@myorg/lib1'`]

const importMatch = `import * as functions from "firebase-functions";`

const notCachedMatch = `[existing outputs match the cache, left as is]`

export async function testPlugin(workspaceDir: string) {
  const indexTsPath = `${workspaceDir}/apps/functions/src/index.ts`

  await runNxCommandAsync('g @simondotm/nx-firebase:app functions')
  await runNxCommandAsync(
    'g @nrwl/js:lib lib1 --buildable --importPath="@myorg/lib1"',
  )

  await it('should build the lib', async () => {
    await runNxCommandAsync('build lib1')
  })

  await it('should build the functions', async () => {
    const { stdout } = await runNxCommandAsync('build functions')
    expectToNotContain(stdout, npmContent)
    expectToNotContain(stdout, libContent)
  })

  await it('should update index.ts so that deps are updated after creation', async () => {
    addContentToTextFile(indexTsPath, importMatch, '// comment added')
    const { stdout } = await runNxCommandAsync('build functions')
    expectToContain(stdout, npmContent)
    expectToNotContain(stdout, libContent)
  })

  await it('should add a lib dependency', async () => {
    const importAddition = `import { lib1 } from '@myorg/lib1'\nconsole.log(lib1())\n`
    addContentToTextFile(indexTsPath, importMatch, importAddition)
    const { stdout } = await runNxCommandAsync('build functions')
    expectToContain(stdout, npmContent)
    expectToContain(stdout, libContent)
  })
}
