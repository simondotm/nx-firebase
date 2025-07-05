import type { Tree } from '@nx/devkit'
import * as devkit from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { packageVersions } from '../../__generated__/nx-firebase-versions'
import { initGenerator } from './init'
import { gitIgnoreRules, nxIgnoreRules } from './lib'
import { workspaceNxVersion } from '../../utils'

/** Silence prettier v3 warnings until Jest v30 is supported by Nx. See:
 * https://github.com/nrwl/nx/issues/26387#issuecomment-2163682690 */
jest.mock('prettier', () => null)

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

  it('should not have dependencies', () => {
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
    expect(packageJson.dependencies['firebase']).toBe(
      `^${packageVersions.firebase}`,
    )
    expect(packageJson.dependencies['firebase-admin']).toBe(
      `^${packageVersions.firebaseAdmin}`,
    )
    expect(packageJson.dependencies['firebase-functions']).toBe(
      `^${packageVersions.firebaseFunctions}`,
    )

    expect(packageJson.devDependencies['firebase-functions-test']).toBe(
      `^${packageVersions.firebaseFunctionsTest}`,
    )
    expect(packageJson.devDependencies['firebase-tools']).toBe(
      `^${packageVersions.firebaseTools}`,
    )
    expect(packageJson.devDependencies['kill-port']).toBe(
      `^${packageVersions.killPort}`,
    )

    // check that plugin init generator adds @google-cloud/functions-framework if pnpm is being used
    if (devkit.detectPackageManager() === 'pnpm') {
      expect(
        packageJson.dependencies['@google-cloud/functions-framework'],
      ).toBe(`^${packageVersions.googleCloudFunctionsFramework}`)
    } else {
      expect(
        packageJson.dependencies['@google-cloud/functions-framework'],
      ).not.toBeDefined()
    }

    expect(packageJson.dependencies['tslib']).not.toBeDefined()
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
    expect(packageJson.devDependencies['firebase-functions-test']).toBe(
      testVersion,
    )
    expect(packageJson.devDependencies['firebase-tools']).toBe(testVersion)
    expect(packageJson.devDependencies['kill-port']).toBe(testVersion)

    const nxVersion = workspaceNxVersion.version
    expect(packageJson.devDependencies['@nx/node']).toBe(nxVersion)
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
