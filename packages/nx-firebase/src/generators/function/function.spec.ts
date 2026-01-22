import {
  getProjects,
  joinPathFragments,
  readJson,
  readProjectConfiguration,
  Tree,
  writeJson,
} from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { functionGenerator } from './function'
import applicationGenerator from '../application/application'

describe('function generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace()
    jest.clearAllMocks()
  })

  it('should generate workspace', () => {
    expect(tree.exists(`firebase.json`)).toBeFalsy()
    expect(tree.exists(`.firebaserc`)).toBeFalsy()
    expect(tree.isFile(`package.json`)).toBeTruthy()
  })

  it('should require a valid firebase app project', async () => {
    // generator should throw if there is no valid firebase app project in the workspace
    await expect(
      functionGenerator(tree, {
        name: 'myFirebaseFunction',
        app: 'myFirebaseApp',
      }),
    ).rejects.toThrow(
      "A firebase application project called 'myFirebaseApp' was not found in this workspace.",
    )
  })

  describe('function generator', () => {
    beforeEach(async () => {
      await applicationGenerator(tree, {
        name: 'myFirebaseApp',
      })
    })

    describe('application setup', () => {
      it('should create a firebase config with no functions', () => {
        const firebaseConfig = readJson(tree, 'firebase.json')
        expect(firebaseConfig.functions.length).toEqual(0)
      })
    })

    describe('function creation', () => {
      it('should generate the correct Nx project config', async () => {
        await functionGenerator(tree, {
          name: 'myFirebaseFunction',
          app: 'myFirebaseApp',
        })
        const project = readProjectConfiguration(tree, 'myFirebaseFunction')
        expect(project.root).toEqual('myFirebaseFunction')
        expect(project.targets).toEqual(
          expect.objectContaining({
            build: {
              executor: '@nx/esbuild:esbuild',
              outputs: ['{options.outputPath}'],
              options: {
                outputPath: 'dist/myFirebaseFunction',
                main: 'myFirebaseFunction/src/main.ts',
                tsConfig: 'myFirebaseFunction/tsconfig.app.json',
                assets: [
                  'myFirebaseFunction/src/assets',
                  {
                    glob: '**/*',
                    input: 'myFirebaseApp/environment',
                    output: '.',
                  },
                ],
                generatePackageJson: true,
                platform: 'node',
                bundle: true,
                thirdParty: false,
                dependenciesFieldType: 'dependencies',
                target: 'node20',
                format: ['esm'],
                esbuildOptions: {
                  logLevel: 'info',
                },
              },
            },
            deploy: {
              executor: 'nx:run-commands',
              options: {
                command: `nx run myFirebaseApp:deploy --only functions:myFirebaseFunction`,
              },
              dependsOn: ['build'],
            },
            test: {
              executor: '@nx/jest:jest',
              outputs: ['{workspaceRoot}/coverage/{projectRoot}'],
              options: {
                jestConfig: expect.stringMatching(
                  /^myFirebaseFunction\/jest\.config\.c?ts$/,
                ),
                passWithNoTests: true,
              },
            },
          }),
        )
        expect(project.targets.serve).toBeUndefined()
        expect(project.targets.lint).toEqual({
          executor: '@nx/eslint:lint',
        })
      })

      it('should update tags', async () => {
        await functionGenerator(tree, {
          name: 'myFirebaseFunction',
          app: 'myFirebaseApp',
          tags: 'one,two',
        })
        const projects = Object.fromEntries(getProjects(tree))
        expect(projects).toMatchObject({
          myFirebaseFunction: {
            tags: [
              'firebase:function',
              'firebase:name:myFirebaseFunction',
              'firebase:dep:myFirebaseApp',
              'one',
              'two',
            ],
          },
        })
      })

      it('should generate files', async () => {
        await functionGenerator(tree, {
          name: 'myFirebaseFunction',
          app: 'myFirebaseApp',
        })
        const root = 'myFirebaseFunction'
        expect(tree.exists(`${root}/src/main.ts`)).toBeTruthy()
        expect(tree.exists(`${root}/src/assets/.gitkeep`)).toBeTruthy()
        expect(tree.exists(`${root}/package.json`)).toBeTruthy()
        expect(tree.exists(`${root}/readme.md`)).toBeTruthy()
        expect(tree.exists(`${root}/project.json`)).toBeTruthy()
        expect(tree.exists(`${root}/tsconfig.app.json`)).toBeTruthy()
        expect(tree.exists(`${root}/tsconfig.json`)).toBeTruthy()
        expect(tree.exists(`${root}/tsconfig.spec.json`)).toBeTruthy()
        // do not want, from node generator
        expect(tree.exists(`${root}/webpack.config.js`)).toBeFalsy()
        expect(tree.exists(`${root}/src/test-setup.ts`)).toBeFalsy()
      })

      it('should generate function in subdirectory', async () => {
        await functionGenerator(tree, {
          name: 'myFirebaseFunction',
          app: 'myFirebaseApp',
          directory: 'subDir',
        })

        const projects = Object.fromEntries(getProjects(tree))
        expect(projects).toMatchObject({
          myFirebaseFunction: {
            tags: [
              'firebase:function',
              'firebase:name:myFirebaseFunction',
              'firebase:dep:myFirebaseApp',
            ],
          },
        })

        const root = 'subDir'
        expect(tree.exists(`${root}/src/main.ts`)).toBeTruthy()
        expect(tree.exists(`${root}/src/assets/.gitkeep`)).toBeTruthy()
        expect(tree.exists(`${root}/package.json`)).toBeTruthy()
        expect(tree.exists(`${root}/readme.md`)).toBeTruthy()
        expect(tree.exists(`${root}/project.json`)).toBeTruthy()
        expect(tree.exists(`${root}/tsconfig.app.json`)).toBeTruthy()
        expect(tree.exists(`${root}/tsconfig.json`)).toBeTruthy()
        expect(tree.exists(`${root}/tsconfig.spec.json`)).toBeTruthy()
        // do not want, from node generator
        expect(tree.exists(`${root}/webpack.config.js`)).toBeFalsy()
        expect(tree.exists(`${root}/src/test-setup.ts`)).toBeFalsy()
      })
    })

    describe('firebase.json functions config', () => {
      it('should add the function to the firebase config', async () => {
        await functionGenerator(tree, {
          name: 'myFirebaseFunction',
          app: 'myFirebaseApp',
        })
        const firebaseConfig = readJson(tree, 'firebase.json')
        expect(firebaseConfig.functions.length).toEqual(1)
        expect(firebaseConfig.functions[0]).toEqual({
          codebase: 'myFirebaseFunction',
          source: 'dist/myFirebaseFunction',
          runtime: `nodejs20`,
          ignore: ['*.local'],
        })
      })

      it('should handle functions being empty object', async () => {
        const firebaseConfigInitial = readJson(tree, 'firebase.json')
        firebaseConfigInitial.functions = {}
        writeJson(tree, 'firebase.json', firebaseConfigInitial)

        await functionGenerator(tree, {
          name: 'myFirebaseFunction',
          app: 'myFirebaseApp',
        })

        const firebaseConfig = readJson(tree, 'firebase.json')
        expect(firebaseConfig.functions.length).toEqual(1)
        expect(firebaseConfig.functions[0]).toEqual({
          codebase: 'myFirebaseFunction',
          source: 'dist/myFirebaseFunction',
          runtime: `nodejs20`,
          ignore: ['*.local'],
        })
      })

      it('should handle functions being already present', async () => {
        const firebaseConfigInitial = readJson(tree, 'firebase.json')
        const testFunction = {
          codebase: 'test',
          source: 'dist/apps/test',
          runtime: `nodejs20`,
          ignore: ['*.local'],
        }
        firebaseConfigInitial.functions = [testFunction]
        writeJson(tree, 'firebase.json', firebaseConfigInitial)

        await functionGenerator(tree, {
          name: 'myFirebaseFunction',
          app: 'myFirebaseApp',
        })

        const firebaseConfig = readJson(tree, 'firebase.json')
        expect(firebaseConfig.functions).toContainEqual(testFunction)
        expect(firebaseConfig.functions).toContainEqual({
          codebase: 'myFirebaseFunction',
          source: 'dist/myFirebaseFunction',
          runtime: `nodejs20`,
          ignore: ['*.local'],
        })
      })
    })

    describe('function options', () => {
      describe('function option --format', () => {
        it('should generate function configured for --format=esm', async () => {
          await functionGenerator(tree, {
            name: 'myFirebaseFunction',
            app: 'myFirebaseApp',
            format: 'esm',
          })
          const project = readProjectConfiguration(tree, 'myFirebaseFunction')
          expect(project.targets.build.options.format).toEqual(['esm'])

          // check the package has the correct module type
          const packageJson = readJson(
            tree,
            joinPathFragments(project.root, 'package.json'),
          )
          expect(packageJson.type).toEqual('module')

          // check the tsconfig
          const tsConfig = readJson(
            tree,
            joinPathFragments(project.root, 'tsconfig.app.json'),
          )
          expect(tsConfig.compilerOptions.module).toEqual('es2020')
        })

        it('should generate function configured for --format=commonjs output', async () => {
          await functionGenerator(tree, {
            name: 'myFirebaseFunction',
            app: 'myFirebaseApp',
            format: 'cjs',
          })
          const project = readProjectConfiguration(tree, 'myFirebaseFunction')
          expect(project.targets.build.options.format).toEqual(['cjs'])

          // check the package has the correct module type
          const packageJson = readJson(
            tree,
            joinPathFragments(project.root, 'package.json'),
          )
          expect(packageJson.type).toEqual('commonjs')

          // check the tsconfig
          const tsConfig = readJson(
            tree,
            joinPathFragments(project.root, 'tsconfig.app.json'),
          )
          expect(tsConfig.compilerOptions.module).toEqual('commonjs')
        })
      })
      describe('function option --runTime', () => {
        it('should generate function with correct node runtime', async () => {
          await functionGenerator(tree, {
            name: 'myFirebaseFunction',
            app: 'myFirebaseApp',
            runTime: '22',
          })
          const project = readProjectConfiguration(tree, 'myFirebaseFunction')

          // check the package has the correct module type
          const packageJson = readJson(
            tree,
            joinPathFragments(project.root, 'package.json'),
          )
          expect(packageJson.engines.node).toEqual('22')

          // check the function firebase config
          const firebaseConfig = readJson(tree, 'firebase.json')
          expect(firebaseConfig.functions[0].runtime).toEqual('nodejs22')
        })
      })
    })
  })
})
