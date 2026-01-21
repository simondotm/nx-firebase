import { getProjects, readProjectConfiguration, Tree } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { applicationGenerator } from './application'

describe('application generator', () => {
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

  it('should update project config', async () => {
    await applicationGenerator(tree, {
      name: 'myFirebaseApp',
    })
    const project = readProjectConfiguration(tree, 'myFirebaseApp')
    expect(project.root).toEqual('myFirebaseApp')
    expect(project.targets).toEqual(
      expect.objectContaining({
        build: {
          executor: 'nx:run-commands',
          dependsOn: ['^build'],
          options: {
            command: `echo Build succeeded.`,
          },
        },
        watch: {
          executor: 'nx:run-commands',
          options: {
            command: `nx run-many --targets=build --projects=tag:firebase:dep:myFirebaseApp --parallel=100 --watch`,
          },
        },
        lint: {
          executor: 'nx:run-commands',
          options: {
            command: `nx run-many --targets=lint --projects=tag:firebase:dep:myFirebaseApp --parallel=100`,
          },
        },
        test: {
          executor: 'nx:run-commands',
          options: {
            command: `nx run-many --targets=test --projects=tag:firebase:dep:myFirebaseApp --parallel=100`,
          },
        },
        firebase: {
          executor: 'nx:run-commands',
          options: {
            command: `firebase --config=firebase.json`,
          },
          configurations: {
            production: {
              command: `firebase --config=firebase.json`,
            },
          },
        },
        killports: {
          executor: 'nx:run-commands',
          options: {
            command: `kill-port --port 9099,5001,8080,9000,5000,8085,9199,9299,4000,4400,4500`,
          },
        },
        getconfig: {
          executor: 'nx:run-commands',
          options: {
            command: `nx run myFirebaseApp:firebase functions:config:get > myFirebaseApp/environment/.runtimeconfig.json`,
          },
        },
        emulate: {
          executor: 'nx:run-commands',
          options: {
            commands: [
              `nx run myFirebaseApp:killports`,
              `nx run myFirebaseApp:firebase emulators:start --import=myFirebaseApp/.emulators --export-on-exit`,
            ],
            parallel: false,
          },
        },
        serve: {
          executor: '@simondotm/nx-firebase:serve',
          options: {
            commands: [
              `nx run myFirebaseApp:watch`,
              `nx run myFirebaseApp:emulate`,
            ],
          },
        },
        deploy: {
          executor: 'nx:run-commands',
          dependsOn: ['build'],
          options: {
            command: `nx run myFirebaseApp:firebase deploy`,
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
      myFirebaseApp: {
        tags: ['firebase:app', 'firebase:name:myFirebaseApp', 'one', 'two'],
      },
    })
  })

  it('should generate files', async () => {
    await applicationGenerator(tree, {
      name: 'myFirebaseApp',
    })
    const root = 'myFirebaseApp'
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
    // environment files
    expect(tree.isFile(`${root}/environment/.secret.local`)).toBeTruthy()
    expect(tree.isFile(`${root}/environment/.env`)).toBeTruthy()
    expect(tree.isFile(`${root}/environment/.env.local`)).toBeTruthy()
  })

  it('should generate multiple firebase configurations', async () => {
    await applicationGenerator(tree, { name: 'myFirebaseApp1' })
    await applicationGenerator(tree, { name: 'myFirebaseApp2' })
    expect(tree.isFile(`firebase.json`)).toBeTruthy()
    expect(tree.isFile(`firebase.myFirebaseApp2.json`)).toBeTruthy()
  })

  it('should generate app in subdirectory', async () => {
    await applicationGenerator(tree, {
      name: 'myFirebaseApp',
      directory: 'subDir',
    })

    // default firebase project files
    const root = `subDir`
    expect(tree.exists(`${root}/public/index.html`)).toBeTruthy()
    expect(tree.exists(`${root}/readme.md`)).toBeTruthy()
    // rules & indexes
    expect(tree.exists(`${root}/database.rules.json`)).toBeTruthy()
    expect(tree.exists(`${root}/firestore.indexes.json`)).toBeTruthy()
    expect(tree.exists(`${root}/firestore.rules`)).toBeTruthy()
    expect(tree.exists(`${root}/storage.rules`)).toBeTruthy()
  })
})
