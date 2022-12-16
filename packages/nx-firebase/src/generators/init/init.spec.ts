import type { Tree } from '@nrwl/devkit'
import * as devkit from '@nrwl/devkit'
import { createTreeWithEmptyV1Workspace } from '@nrwl/devkit/testing'
import {
  firebaseAdminVersion,
  firebaseFunctionsTestVersion,
  firebaseFunctionsVersion,
  firebaseToolsVersion,
  firebaseVersion,
} from '../../utils/versions'
import { initGenerator } from './init'
import { gitIgnoreEntries } from './lib'

describe('init generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyV1Workspace()
    jest.clearAllMocks()
  })

  it('should add gitignores', async () => {
    await initGenerator(tree, {})
    const gitIgnore = tree.read('.gitignore')
    expect(gitIgnore.toString('utf-8')).toContain(gitIgnoreEntries)
  })

  it('should add dependencies', async () => {
    await initGenerator(tree, {})

    const packageJson = devkit.readJson(tree, 'package.json')
    expect(packageJson.dependencies['firebase']).toBe(firebaseVersion)
    expect(packageJson.dependencies['firebase-admin']).toBe(
      firebaseAdminVersion,
    )
    expect(packageJson.dependencies['firebase-functions']).toBe(
      firebaseFunctionsVersion,
    )
    expect(packageJson.dependencies['tslib']).toBeDefined()

    expect(packageJson.devDependencies['firebase-functions-test']).toBe(
      firebaseFunctionsTestVersion,
    )
    expect(packageJson.devDependencies['firebase-tools']).toBe(
      firebaseToolsVersion,
    )
  })

  it('should add jest config when unitTestRunner is jest', async () => {
    await initGenerator(tree, { unitTestRunner: 'jest' })

    expect(tree.exists('jest.config.ts')).toBe(true)
  })

  it('should not add jest config when unitTestRunner is none', async () => {
    await initGenerator(tree, { unitTestRunner: 'none' })

    expect(tree.exists('jest.config.ts')).toBe(false)
  })

  describe('--skipFormat', () => {
    it('should format files by default', async () => {
      jest.spyOn(devkit, 'formatFiles')

      await initGenerator(tree, {})

      expect(devkit.formatFiles).toHaveBeenCalled()
    })

    it('should not format files when --skipFormat=true', async () => {
      jest.spyOn(devkit, 'formatFiles')

      await initGenerator(tree, { skipFormat: true })

      expect(devkit.formatFiles).not.toHaveBeenCalled()
    })
  })
})
