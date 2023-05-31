import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree, readProjectConfiguration } from '@nx/devkit'

import generator from './generator'
import { SyncGeneratorSchema } from './schema'

describe('sync generator', () => {
  let tree: Tree
  const options: SyncGeneratorSchema = { name: 'test' }

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  it('should run successfully', async () => {
    await generator(tree, options)
    // const config = readProjectConfiguration(tree, 'test')
    // expect(config).toBeDefined()
  })
})
