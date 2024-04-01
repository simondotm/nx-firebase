import {
  readJson,
} from '@nx/plugin/testing'

import {
  safeRunNxCommandAsync,
} from '../test-utils'

export function testWorkspace() {
  describe('workspace setup', () => {

    it(
      'should create workspace without firebase dependencies',
      async () => {
        // test that generator adds dependencies to workspace package.json
        // should not be initially set
        const packageJson = readJson(`package.json`)
        expect(packageJson.dependencies['firebase']).toBeUndefined()
        expect(packageJson.dependencies['firebase-admin']).toBeUndefined()
        expect(packageJson.dependencies['firebase-functions']).toBeUndefined()
        expect(
          packageJson.devDependencies['firebase-functions-test'],
        ).toBeUndefined()
        expect(packageJson.devDependencies['firebase-tools']).toBeUndefined()
    })

    it(
      'should create workspace without nx dependencies',
      async () => {
        // test that generator adds dependencies to workspace package.json
        // should not be initially set
        const packageJson = readJson(`package.json`)
        expect(packageJson.devDependencies['@nx/node']).toBeUndefined()
    })

    it(
      'should run nx-firebase init',
      async () => {
        await safeRunNxCommandAsync(`generate @simondotm/nx-firebase:init`)
        // test that generator adds dependencies to workspace package.json
        const packageJson = readJson(`package.json`)
        expect(packageJson.dependencies['firebase']).toBeDefined()
        expect(packageJson.dependencies['firebase-admin']).toBeDefined()
        expect(packageJson.dependencies['firebase-functions']).toBeDefined()
        expect(
          packageJson.devDependencies['firebase-functions-test'],
        ).toBeDefined()
        expect(packageJson.devDependencies['firebase-tools']).toBeDefined()
        //SM: Mar'24: our plugin init generator now only add @nx/node
        expect(packageJson.devDependencies['@nx/node']).toBeDefined()
    })
  })
}