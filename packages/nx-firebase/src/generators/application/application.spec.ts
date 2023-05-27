import { getProjects, readProjectConfiguration, Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { applicationGenerator } from './application'

describe('application generator', () => {
  let tree: Tree

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace({
      layout: 'apps-libs',
    })
    jest.clearAllMocks()
  })

  it('should generate workspace', async () => {
    expect(tree.exists(`firebase.json`)).toBeFalsy()
    expect(tree.exists(`.firebaserc`)).toBeFalsy()
    expect(tree.isFile(`package.json`)).toBeTruthy()
  })

  it('should update project config', async () => {
    await applicationGenerator(tree, {
      name: 'myFirebaseApp',
    })
    const project = readProjectConfiguration(tree, 'my-firebase-app')
    expect(project.root).toEqual('apps/my-firebase-app')
    expect(project.targets).toEqual(
      expect.objectContaining({
        build: {
          executor: 'nx:run-commands',
          options: {
            command: `nx run-many --targets=build --projects=tag:my-firebase-app --parallel=100`,
          },
        },
        lint: {
          executor: 'nx:run-commands',
          options: {
            command: `nx run-many --targets=lint --projects=tag:my-firebase-app --parallel=100`,
          },
        },
        test: {
          executor: 'nx:run-commands',
          options: {
            command: `nx run-many --targets=test --projects=tag:my-firebase-app --parallel=100`,
          },
        },
        getconfig: {
          executor: 'nx:run-commands',
          options: {
            command: `firebase functions:config:get --config=firebase.json > apps/my-firebase-app/.runtimeconfig.json`,
          },
        },
        emulate: {
          executor: 'nx:run-commands',
          options: {
            commands: [
              'kill-port --port 9099,5001,8080,9000,5000,8085,9199,9299,4000,4400,4500',
              `firebase emulators:start --config=firebase.json --import=apps/my-firebase-app/.emulators --export-on-exit`,
            ],
            parallel: false,
          },
        },
        serve: {
          executor: 'nx:run-commands',
          options: {
            commands: [
              `nx run my-firebase-app:emulate`,
              `nx build my-firebase-app --watch`,
            ],
          },
        },
        deploy: {
          executor: 'nx:run-commands',
          dependsOn: ['build'],
          options: {
            command: `firebase deploy --config=firebase.json`,
          },
          configurations: {
            production: {
              command: `firebase deploy --config=firebase.json`,
            },
          },
        },
      }),
    )
  })

  it('should update tags', async () => {
    await applicationGenerator(tree, {
      name: 'myFirebaseApp',
      tags: 'one,two',
    })
    const projects = Object.fromEntries(getProjects(tree))
    expect(projects).toMatchObject({
      'my-firebase-app': {
        tags: ['one', 'two'],
      },
    })
  })

  it('should generate files', async () => {
    await applicationGenerator(tree, {
      name: 'myFirebaseApp',
    })
    const root = 'apps/my-firebase-app'
    // default firebase project files
    expect(tree.exists(`${root}/public/index.html`)).toBeTruthy()
    expect(tree.exists(`${root}/readme.md`)).toBeTruthy()
    // rules & indexes
    expect(tree.exists(`${root}/database.rules.json`)).toBeTruthy()
    expect(tree.exists(`${root}/firestore.indexes.json`)).toBeTruthy()
    expect(tree.exists(`${root}/firestore.rules`)).toBeTruthy()
    expect(tree.exists(`${root}/storage.rules`)).toBeTruthy()
    // workspace firebase configs
    expect(tree.isFile(`package.json`)).toBeTruthy()
    expect(tree.isFile(`firebase.json`)).toBeTruthy()
    expect(tree.isFile(`.firebaserc`)).toBeTruthy()
  })

  it('should generate multiple firebase configurations', async () => {
    await applicationGenerator(tree, { name: 'myFirebaseApp1' })
    await applicationGenerator(tree, { name: 'myFirebaseApp2' })
    expect(tree.isFile(`firebase.json`)).toBeTruthy()
    expect(tree.isFile(`firebase.my-firebase-app2.json`)).toBeTruthy()
  })

  it('should generate app in subdirectory', async () => {
    await applicationGenerator(tree, {
      name: 'myFirebaseApp',
      directory: 'subDir',
    })

    // default firebase project files
    const root = `apps/sub-dir/my-firebase-app`
    expect(tree.exists(`${root}/public/index.html`)).toBeTruthy()
    expect(tree.exists(`${root}/readme.md`)).toBeTruthy()
    // rules & indexes
    expect(tree.exists(`${root}/database.rules.json`)).toBeTruthy()
    expect(tree.exists(`${root}/firestore.indexes.json`)).toBeTruthy()
    expect(tree.exists(`${root}/firestore.rules`)).toBeTruthy()
    expect(tree.exists(`${root}/storage.rules`)).toBeTruthy()
  })

  // TODO:
  // check --firebaseProject
  // check --firebaseConfig
  // check multiple apps
  //

  // describe('--skipFormat', () => {
  //   it('should format files', async () => {
  //     jest.spyOn(devkit, 'formatFiles')

  //     await applicationGenerator(tree, { name: appName })

  //     expect(devkit.formatFiles).toHaveBeenCalled()
  //   })

  //   // it('should not format files when --skipFormat=true', async () => {
  //   //   jest.spyOn(devkit, 'formatFiles')

  //   //   await applicationGenerator(tree, { name: appName, skipFormat: true })

  //   //   expect(devkit.formatFiles).not.toHaveBeenCalled()
  //   // })
  // })

  // This is an app generator test
  // it('should generate multiple firebase configurations', async () => {
  //   await functionGenerator(tree, {
  //     name: 'myFirebaseFunction1',
  //     firebaseApp: 'my-firebase-app',
  //   })
  //   await functionGenerator(tree, {
  //     name: 'myFirebaseFunction2',
  //     firebaseApp: 'my-firebase-app',
  //   })

  //   console.log(tree)

  //   expect(tree.isFile(`firebase.json`)).toBeTruthy()
  //   expect(tree.isFile(`firebase.my-firebase-app.json`)).toBeTruthy()
  // })
})
