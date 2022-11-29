import { BuildExecutorSchema } from './schema'
import executor, { getDependencies } from './build'
import { ExecutorContext, Tree } from '@nrwl/devkit'
import { ExecutorOptions } from '@nrwl/js/src/utils/schema'
import { createTreeWithEmptyV1Workspace } from '@nrwl/devkit/testing'

const options: BuildExecutorSchema = {}

describe('Build Executor', () => {
  let context: ExecutorContext
  let testOptions: ExecutorOptions

  let tree: Tree

  beforeEach(async () => {
    tree = createTreeWithEmptyV1Workspace()
    jest.clearAllMocks()

    context = {
      root: '/root',
      cwd: '/root',
      workspace: {
        version: 2,
        projects: {},
        npmScope: 'test',
      },
      isVerbose: false,
      projectName: 'example',
      targetName: 'build',
    }
    testOptions = {
      main: 'libs/ui/src/index.ts',
      outputPath: 'dist/libs/ui',
      tsConfig: 'libs/ui/tsconfig.json',
      assets: [],
      transformers: [],
      watch: false,
      clean: true,
    }
  })

  it('can run', async () => {
    const output = await executor(testOptions, context)

    const dependencies = await getDependencies(context)
    const n = JSON.stringify(dependencies, null, 3)

    expect(n).toBe('simon')
    //expect(output.success).toBe(true)
  })
})
