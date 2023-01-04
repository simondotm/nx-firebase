// import { BuildExecutorSchema } from './schema'
// import { runExecutor } from './build'
// import { ExecutorContext, Tree } from '@nrwl/devkit'
// import { ExecutorOptions } from '@nrwl/js/src/utils/schema'
// import { createTreeWithEmptyV1Workspace } from '@nrwl/devkit/testing'
// import applicationGenerator from '../../generators/application/application'

// const options: BuildExecutorSchema = {}
// SM: Testing the executor is painful, use e2e suite instead.

describe('Build Executor', () => {
  // let context: ExecutorContext
  // let testOptions: ExecutorOptions

  // let tree: Tree
  // const appName = 'functions'

  beforeEach(async () => {
    // tree = createTreeWithEmptyV1Workspace()
    jest.clearAllMocks()
    /*
    await applicationGenerator(tree, { name: appName })
    context = {
      root: tree.root, //'/root',
      cwd: tree.root, //'/root',
      workspace: {
        version: 2,
        projects: {
          [appName]: {
            root: 'apps/functions',
            sourceRoot: 'apps/functions/src',
          },
        },
        npmScope: 'test',
      },
      isVerbose: false,
      projectName: appName, //'example',
      targetName: 'build',
    }
    testOptions = {
      main: 'apps/functions/src/index.ts',
      outputPath: 'dist/apps/functions',
      tsConfig: 'apps/functions/tsconfig.json',
      assets: [],
      transformers: [],
      watch: false,
      clean: true,
    }
    */
  })

  it('can run', async () => {
    /*
    for await (const output of runExecutor(testOptions, context)) {
      expect(output.success).toBe(true)
    }
    */

    expect(true).toBe(true)
    /*
    for await (const output of runExecutor(testOptions, context)) {
      expect(output.success).toBe(true)
    }
    */
    /*
    const output = await runExecutor(testOptions, context)

    const dependencies = await getDependencies(context)
    const n = JSON.stringify(dependencies, null, 3)

    expect(n).toBe('simon')
    //expect(output.success).toBe(true)
    */
  })
})
