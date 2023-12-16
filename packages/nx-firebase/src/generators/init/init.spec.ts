import type { Tree } from '@nx/devkit'
import * as devkit from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import {
  firebaseAdminVersion,
  firebaseFunctionsTestVersion,
  firebaseFunctionsVersion,
  firebaseToolsVersion,
  firebaseVersion,
  killportVersion,
} from '../../utils/versions'
import { initGenerator } from './init'
import { gitIgnoreRules, nxIgnoreRules } from './lib'
import { workspaceNxVersion } from '../../utils'

describe('init generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({
      layout: 'apps-libs',
    })
    jest.clearAllMocks()
  })

  it('should add .gitignore rules', async () => {
    await initGenerator(tree, {})
    const gitIgnore = tree.read('.gitignore')
    expect(gitIgnore.toString('utf-8')).toContain(
      `${gitIgnoreRules.join('\n')}\n`,
    )
  })

  it('should add missing .gitignore rules', async () => {
    // replace .gitignore with a partial list to check plugin adds missing rules individually
    tree.write('.gitignore', `${gitIgnoreRules.slice(0, 3).join('\n')}\n`)
    await initGenerator(tree, {})
    const gitIgnore = tree.read('.gitignore')
    expect(gitIgnore.toString('utf-8')).toContain(
      `${gitIgnoreRules.join('\n')}\n`,
    )
  })

  it('should add .nxignore rules', async () => {
    await initGenerator(tree, {})
    const nxIgnore = tree.read('.nxignore')
    expect(nxIgnore.toString('utf-8')).toContain(
      `${nxIgnoreRules.join('\n')}\n`,
    )
  })

  it('should add missing .nxignore rules', async () => {
    // replace .nxignore with a partial list to check plugin adds missing rules individually
    tree.write('.nxignore', `${nxIgnoreRules.slice(0, 1).join('\n')}\n`)
    await initGenerator(tree, {})
    const nxIgnore = tree.read('.nxignore')
    expect(nxIgnore.toString('utf-8')).toContain(
      `${nxIgnoreRules.join('\n')}\n`,
    )
  })

  it('should not have dependencies', async () => {
    const packageJson = devkit.readJson(tree, 'package.json')
    expect(packageJson.dependencies['firebase']).toBeUndefined()
    expect(packageJson.dependencies['firebase-admin']).toBeUndefined()
    expect(packageJson.dependencies['firebase-functions']).toBeUndefined()
    expect(packageJson.dependencies['tslib']).toBeUndefined()

    expect(
      packageJson.devDependencies['firebase-functions-test'],
    ).toBeUndefined()
    expect(packageJson.devDependencies['firebase-tools']).toBeUndefined()
    expect(packageJson.devDependencies['kill-port']).toBeUndefined()
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
    expect(packageJson.devDependencies['kill-port']).toBe(killportVersion)
  })

  it('should only add dependencies if not already present', async () => {
    const packageJsonDefault = devkit.readJson(tree, 'package.json')

    const testVersion = '0.0.1'
    packageJsonDefault.dependencies['firebase'] = testVersion
    packageJsonDefault.dependencies['firebase-admin'] = testVersion
    packageJsonDefault.dependencies['firebase-functions'] = testVersion
    // packageJsonDefault.dependencies['tslib'] = testVersion

    packageJsonDefault.devDependencies['firebase-tools'] = testVersion
    packageJsonDefault.devDependencies['kill-port'] = testVersion
    packageJsonDefault.devDependencies['firebase-functions-test'] = testVersion

    devkit.writeJson(tree, 'package.json', packageJsonDefault)

    await initGenerator(tree, {})

    const packageJson = devkit.readJson(tree, 'package.json')

    expect(packageJson.dependencies['firebase']).toBe(testVersion)
    expect(packageJson.dependencies['firebase-admin']).toBe(testVersion)
    expect(packageJson.dependencies['firebase-functions']).toBe(testVersion)
    // expect(packageJson.dependencies['tslib']).toBe(testVersion)

    expect(packageJson.devDependencies['firebase-functions-test']).toBe(
      testVersion,
    )
    expect(packageJson.devDependencies['firebase-tools']).toBe(testVersion)
    expect(packageJson.devDependencies['kill-port']).toBe(testVersion)

    const nxVersion = workspaceNxVersion.version
    expect(packageJson.devDependencies['@nx/node']).toBe(nxVersion)
    expect(packageJson.devDependencies['@nx/eslint']).toBe(nxVersion)
    expect(packageJson.devDependencies['@nx/jest']).toBe(nxVersion)
    expect(packageJson.devDependencies['@nx/esbuild']).toBe(nxVersion)
    expect(packageJson.devDependencies['@nx/js']).toBe(nxVersion)
  })

  it('should add jest config when unitTestRunner is jest', async () => {
    await initGenerator(tree, { unitTestRunner: 'jest' })

    expect(tree.exists('jest.config.ts')).toBe(true)
  })

  it('should not add jest config when unitTestRunner is none', async () => {
    await initGenerator(tree, { unitTestRunner: 'none' })

    expect(tree.exists('jest.config.ts')).toBe(false)
  })

  // describe('--skipFormat', () => {
  //   it('should format files by default', async () => {
  //     jest.spyOn(devkit, 'formatFiles')

  //     await initGenerator(tree, {})

  //     expect(devkit.formatFiles).toHaveBeenCalled()
  //   })

  //   it('should not format files when --skipFormat=true', async () => {
  //     jest.spyOn(devkit, 'formatFiles')

  //     await initGenerator(tree, { skipFormat: true })

  //     expect(devkit.formatFiles).not.toHaveBeenCalled()
  //   })
  // })
})
