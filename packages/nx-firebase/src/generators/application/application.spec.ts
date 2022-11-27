import type { Tree } from '@nrwl/devkit'
import * as devkit from '@nrwl/devkit'
import { createTreeWithEmptyV1Workspace } from '@nrwl/devkit/testing'
import { applicationGenerator } from './application'

describe('application generator', () => {
  let tree: Tree
  const appName = 'myFirebaseApp'
  const appDirectory = 'my-firebase-app'

  beforeEach(() => {
    tree = createTreeWithEmptyV1Workspace()
    jest.clearAllMocks()
  })

  it('should generate files', async () => {
    await applicationGenerator(tree, { name: appName })

    // default firebase project files
    expect(tree.exists(`apps/${appDirectory}/src/index.ts`)).toBeTruthy()
    expect(tree.exists(`apps/${appDirectory}/public/index.html`)).toBeTruthy()
    expect(tree.exists(`apps/${appDirectory}/package.json`)).toBeTruthy()
    expect(tree.exists(`apps/${appDirectory}/readme.md`)).toBeTruthy()
    // rules & indexes
    expect(tree.exists(`apps/${appDirectory}/database.rules.json`)).toBeTruthy()
    expect(
      tree.exists(`apps/${appDirectory}/firestore.indexes.json`),
    ).toBeTruthy()
    expect(tree.exists(`apps/${appDirectory}/firestore.rules`)).toBeTruthy()
    expect(tree.exists(`apps/${appDirectory}/storage.rules`)).toBeTruthy()
    // workspace firebase configs
    expect(tree.isFile(`package.json`)).toBeTruthy()
    expect(tree.isFile(`firebase.json`)).toBeTruthy()

    expect(tree.exists(`firebase.${appName}.json`)).toBeTruthy()
    expect(tree.exists(`firebase.json`)).toBeTruthy()
    expect(tree.exists(`.firebaserc`)).toBeTruthy()
  })

  it('should configure tsconfig correctly', async () => {
    await applicationGenerator(tree, { name: appName })

    const tsConfig = devkit.readJson(
      tree,
      `apps/${appDirectory}/tsconfig.app.json`,
    )
    expect(tsConfig.compilerOptions.emitDecoratorMetadata).toBe(true)
    expect(tsConfig.compilerOptions.target).toBe('es2015')
    expect(tsConfig.exclude).toEqual([
      'jest.config.ts',
      '**/*.spec.ts',
      '**/*.test.ts',
    ])
  })

  describe('--skipFormat', () => {
    it('should format files', async () => {
      jest.spyOn(devkit, 'formatFiles')

      await applicationGenerator(tree, { name: appName })

      expect(devkit.formatFiles).toHaveBeenCalled()
    })

    it('should not format files when --skipFormat=true', async () => {
      jest.spyOn(devkit, 'formatFiles')

      await applicationGenerator(tree, { name: appName, skipFormat: true })

      expect(devkit.formatFiles).not.toHaveBeenCalled()
    })
  })
})
