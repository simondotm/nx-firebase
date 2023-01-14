import { runNxCommandAsync } from './exec'
import { addContentToTextFile } from './utils'

/**
 * Test helper function approximating the Jest style of expect().toContain()
 * @param content
 * @param expected
 * @returns true if content contains expected string
 */
export function expectToContain(content: string, expected: string) {
  return content.includes(expected)
}

export async function testPlugin(workspaceDir: string) {
  await runNxCommandAsync('g @simondotm/nx-firebase:app functions')
  await runNxCommandAsync(
    'g @nrwl/js:lib lib1 --buildable --importPath="@myorg/lib1"',
  )
  await runNxCommandAsync('build lib1')
  await runNxCommandAsync('build functions')

  // update index.ts so that deps are updated after creation
  const importMatch = `import * as functions from 'firebase-functions';`
  addContentToTextFile(
    `${workspaceDir}/apps/functions/src/index.ts`,
    importMatch,
    '// comment added',
  )
  await runNxCommandAsync('build functions')

  // add a lib dependency
  const importAddition = `import { lib1 } from '@myorg/lib1'\nconsole.log(lib1())\n`
  addContentToTextFile(
    `${workspaceDir}/apps/functions/src/index.ts`,
    importMatch,
    importAddition,
  )
  await runNxCommandAsync('build functions')
}
