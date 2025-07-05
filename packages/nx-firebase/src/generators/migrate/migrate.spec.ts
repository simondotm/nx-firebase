import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree } from '@nx/devkit'

import generator from './migrate'
// import { MigrateGeneratorSchema } from './schema'

// migrate is tested in e2e.

/** Silence prettier v3 warnings until Jest v30 is supported by Nx. See:
 * https://github.com/nrwl/nx/issues/26387#issuecomment-2163682690 */
jest.mock('prettier', () => null)

describe('migrate generator', () => {
  let tree: Tree
  // const options: MigrateGeneratorSchema = {}

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('should run successfully', async () => {
    await generator(tree, {})
    // const config = readProjectConfiguration(tree, 'test')
    // expect(config).toBeDefined()
  })
})
