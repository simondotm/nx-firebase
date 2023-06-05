import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { Tree, readProjectConfiguration } from '@nx/devkit'

import generator from './sync'
import { SyncGeneratorSchema } from './schema'
import applicationGenerator from '../application/application'
import functionGenerator from '../function/function'

describe('sync generator', () => {
  let tree: Tree
  const options: SyncGeneratorSchema = { app: 'test' }

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
  })

  // check we handle:
  // sync per project & sync all projects
  // - function renamed
  // - app renamed
  // - function deleted
  // - app deleted
  // - function & app renamed
  // --project option

  it('should run successfully', async () => {
    await generator(tree, {})
    // const config = readProjectConfiguration(tree, 'test')
    // expect(config).toBeDefined()
  })

  // it('should handle renamed function', async () => {
  //   await applicationGenerator(tree, {
  //     name: 'myFirebaseApp',
  //   })
  //   await functionGenerator(tree, {
  //     name: 'myFirebaseFunction',
  //     app: 'myFirebaseApp',
  //   })
  // })
})
