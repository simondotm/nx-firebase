
> nx run nxfirebase-root-app:functions 
Executor ran for functions
options={
   "outputPath": "dist/apps/nxfirebase-root-app",
   "tsConfig": "apps/nxfirebase-root-app/tsconfig.app.json",
   "packageJson": "apps/nxfirebase-root-app/package.json",
   "main": "apps/nxfirebase-root-app/src/index.ts",
   "assets": [
      "apps/nxfirebase-root-app/*.md"
   ]
}
context={
   "root": "C:\\Users\\podvi\\Dropbox\\GitHub\\nxfirebase\\tmp\\nx-e2e\\proj",
   "target": {
      "executor": "@simondotm/nxfirebase:functions",
      "outputs": [
         "{options.outputPath}"
      ],
      "options": {
         "outputPath": "dist/apps/nxfirebase-root-app",
         "tsConfig": "apps/nxfirebase-root-app/tsconfig.app.json",
         "packageJson": "apps/nxfirebase-root-app/package.json",
         "main": "apps/nxfirebase-root-app/src/index.ts",
         "assets": [
            "apps/nxfirebase-root-app/*.md"
         ]
      }
   },
   "workspace": {
      "version": 2,
      "projects": {
         "nxfirebase-root-app": {
            "root": "apps/nxfirebase-root-app",
            "projectType": "application",
            "sourceRoot": "apps/nxfirebase-root-app/src",
            "targets": {
               "compile": {
                  "executor": "@nrwl/node:package",
                  "outputs": [
                     "{options.outputPath}"
                  ],
                  "options": {
                     "outputPath": "dist/apps/nxfirebase-root-app",
                     "tsConfig": "apps/nxfirebase-root-app/tsconfig.app.json",
                     "packageJson": "apps/nxfirebase-root-app/package.json",
                     "main": "apps/nxfirebase-root-app/src/index.ts",
                     "assets": [
                        "apps/nxfirebase-root-app/*.md"
                     ]
                  }
               },
               "functions": {
                  "executor": "@simondotm/nxfirebase:functions",
                  "outputs": [
                     "{options.outputPath}"
                  ],
                  "options": {
                     "outputPath": "dist/apps/nxfirebase-root-app",
                     "tsConfig": "apps/nxfirebase-root-app/tsconfig.app.json",
                     "packageJson": "apps/nxfirebase-root-app/package.json",
                     "main": "apps/nxfirebase-root-app/src/index.ts",
                     "assets": [
                        "apps/nxfirebase-root-app/*.md"
                     ]
                  }
               },
               "build": {
                  "executor": "@nrwl/workspace:run-commands",
                  "options": {
                     "commands": [
                        {
                           "command": "nx run nxfirebase-root-app:compile --with-deps"
                        },
                        {
                           "command": "nx run nxfirebase-root-app:functions"
                        },
                        {
                           "command": "echo all done"
                        }
                     ],
                     "parallel": false
                  }
               }
            }
         },
         "subdir-nxfirebase-subdir-app": {
            "root": "apps/subdir/nxfirebase-subdir-app",
            "projectType": "application",
            "sourceRoot": "apps/subdir/nxfirebase-subdir-app/src",
            "targets": {
               "compile": {
                  "executor": "@nrwl/node:package",
                  "outputs": [
                     "{options.outputPath}"
                  ],
                  "options": {
                     "outputPath": "dist/apps/subdir/nxfirebase-subdir-app",
                     "tsConfig": "apps/subdir/nxfirebase-subdir-app/tsconfig.app.json",
                     "packageJson": "apps/subdir/nxfirebase-subdir-app/package.json",
                     "main": "apps/subdir/nxfirebase-subdir-app/src/index.ts",
                     "assets": [
                        "apps/subdir/nxfirebase-subdir-app/*.md"
                     ]
                  }
               },
               "functions": {
                  "executor": "@simondotm/nxfirebase:functions",
                  "outputs": [
                     "{options.outputPath}"
                  ],
                  "options": {
                     "outputPath": "dist/apps/subdir/nxfirebase-subdir-app",
                     "tsConfig": "apps/subdir/nxfirebase-subdir-app/tsconfig.app.json",
                     "packageJson": "apps/subdir/nxfirebase-subdir-app/package.json",
                     "main": "apps/subdir/nxfirebase-subdir-app/src/index.ts",
                     "assets": [
                        "apps/subdir/nxfirebase-subdir-app/*.md"
                     ]
                  }
               },
               "build": {
                  "executor": "@nrwl/workspace:run-commands",
                  "options": {
                     "commands": [
                        {
                           "command": "nx run subdir-nxfirebase-subdir-app:compile --with-deps"
                        },
                        {
                           "command": "nx run subdir-nxfirebase-subdir-app:functions"
                        },
                        {
                           "command": "echo all done"
                        }
                     ],
                     "parallel": false
                  }
               }
            }
         },
         "nxfirebase-root-app-tags": {
            "root": "apps/nxfirebase-root-app-tags",
            "projectType": "application",
            "sourceRoot": "apps/nxfirebase-root-app-tags/src",
            "targets": {
               "compile": {
                  "executor": "@nrwl/node:package",
                  "outputs": [
                     "{options.outputPath}"
                  ],
                  "options": {
                     "outputPath": "dist/apps/nxfirebase-root-app-tags",
                     "tsConfig": "apps/nxfirebase-root-app-tags/tsconfig.app.json",
                     "packageJson": "apps/nxfirebase-root-app-tags/package.json",
                     "main": "apps/nxfirebase-root-app-tags/src/index.ts",
                     "assets": [
                        "apps/nxfirebase-root-app-tags/*.md"
                     ]
                  }
               },
               "functions": {
                  "executor": "@simondotm/nxfirebase:functions",
                  "outputs": [
                     "{options.outputPath}"
                  ],
                  "options": {
                     "outputPath": "dist/apps/nxfirebase-root-app-tags",
                     "tsConfig": "apps/nxfirebase-root-app-tags/tsconfig.app.json",
                     "packageJson": "apps/nxfirebase-root-app-tags/package.json",
                     "main": "apps/nxfirebase-root-app-tags/src/index.ts",
                     "assets": [
                        "apps/nxfirebase-root-app-tags/*.md"
                     ]
                  }
               },
               "build": {
                  "executor": "@nrwl/workspace:run-commands",
                  "options": {
                     "commands": [
                        {
                           "command": "nx run nxfirebase-root-app-tags:compile --with-deps"
                        },
                        {
                           "command": "nx run nxfirebase-root-app-tags:functions"
                        },
                        {
                           "command": "echo all done"
                        }
                     ],
                     "parallel": false
                  }
               }
            }
         },
         "nodelib": {
            "root": "libs/nodelib",
            "sourceRoot": "libs/nodelib/src",
            "projectType": "library",
            "targets": {
               "build": {
                  "executor": "@nrwl/node:package",
                  "outputs": [
                     "{options.outputPath}"
                  ],
                  "options": {
                     "outputPath": "dist/libs/nodelib",
                     "tsConfig": "libs/nodelib/tsconfig.lib.json",
                     "packageJson": "libs/nodelib/package.json",
                     "main": "libs/nodelib/src/index.ts",
                     "assets": [
                        "libs/nodelib/*.md"
                     ]
                  }
               },
               "lint": {
                  "executor": "@nrwl/linter:eslint",
                  "options": {
                     "lintFilePatterns": [
                        "libs/nodelib/**/*.ts"
                     ]
                  }
               },
               "test": {
                  "executor": "@nrwl/jest:jest",
                  "outputs": [
                     "coverage/libs/nodelib"
                  ],
                  "options": {
                     "jestConfig": "libs/nodelib/jest.config.js",
                     "passWithNoTests": true
                  }
               }
            }
         }
      },
      "cli": {
         "defaultCollection": "@nrwl/workspace"
      }
   },
   "projectName": "nxfirebase-root-app",
   "targetName": "functions",
   "cwd": "C:\\Users\\podvi\\Dropbox\\GitHub\\nxfirebase\\tmp\\nx-e2e\\proj",
   "isVerbose": false
}
projGraph={
   "nodes": {
      "nxfirebase": {
         "name": "nxfirebase",
         "type": "lib",
         "data": {
            "root": "packages/nxfirebase",
            "sourceRoot": "packages/nxfirebase/src",
            "projectType": "library",
            "targets": {
               "lint": {
                  "executor": "@nrwl/linter:eslint",
                  "options": {
                     "lintFilePatterns": [
                        "packages/nxfirebase/**/*.ts"
                     ]
                  }
               },
               "test": {
                  "executor": "@nrwl/jest:jest",
                  "outputs": [
                     "coverage/packages/nxfirebase"
                  ],
                  "options": {
                     "jestConfig": "packages/nxfirebase/jest.config.js",
                     "passWithNoTests": true
                  }
               },
               "build": {
                  "executor": "@nrwl/node:package",
                  "outputs": [
                     "{options.outputPath}"
                  ],
                  "options": {
                     "outputPath": "dist/packages/nxfirebase",
                     "tsConfig": "packages/nxfirebase/tsconfig.lib.json",
                     "packageJson": "packages/nxfirebase/package.json",
                     "main": "packages/nxfirebase/src/index.ts",
                     "assets": [
                        "packages/nxfirebase/*.md",
                        {
                           "input": "./packages/nxfirebase/src",
                           "glob": "**/*.!(ts)",
                           "output": "./src"
                        },
                        {
                           "input": "./packages/nxfirebase",
                           "glob": "generators.json",
                           "output": "."
                        },
                        {
                           "input": "./packages/nxfirebase",
                           "glob": "executors.json",
                           "output": "."
                        }
                     ]
                  }
               }
            },
            "tags": [],
            "files": [
               {
                  "file": "packages/nxfirebase/.babelrc",
                  "hash": "9065e090995b88f1c498325e875aee5fa5127faea2bc80a2167813700a1da429",
                  "ext": ""
               },
               {
                  "file": "packages/nxfirebase/.eslintrc.json",
                  "hash": "c9a85022f69e3f8cf316ebf26ee06e424fddf5c067e0ebb6574dfad85158b41d",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/executors.json",
                  "hash": "47065ad9bf87d99be693ccb0213b0302a88f6b05de94b7374bc491ce4df6073c",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/generators.json",
                  "hash": "37406f52f207546a9bdf90f358202dec6d2f32c4615d661d05715261da29a846",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/jest.config.js",
                  "hash": "be5c8b1440d319b53a2704c16b47ec289ef34dfc4654aac4cad43a6d89d26afa",
                  "ext": ".js"
               },
               {
                  "file": "packages/nxfirebase/notes.md",
                  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                  "ext": ".md"
               },
               {
                  "file": "packages/nxfirebase/package.json",
                  "hash": "f3205645d7ce21312854d68d04562f78ecc9d7ad17e573191332260a5a09463f",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/README.md",
                  "hash": "6143c7e5789fe6260c4e14bb18c2fd99995787734c2ebee3b224e93786c90d53",
                  "ext": ".md"
               },
               {
                  "file": "packages/nxfirebase/src/executors/build/executor.spec.ts",
                  "hash": "d279c6d96eee06624a6b4734de5b19003e065eeb5f5963436f0b8bfaaf0618f6",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/executors/build/executor.ts",
                  "hash": "f0a4a1e14cb92921f2daacd45cabc5d0c12a305c790ae71ef3365464ff1ba431",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/executors/build/schema.d.ts",
                  "hash": "24025354749a21432bad1706394598e64578ce964d905de4c406da5b895cc68a",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/executors/build/schema.json",
                  "hash": "7dc1d1fe2394a40831e629f54e5a39c843b0f853911ca873aed8d3fa7bd4f742",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/src/executors/functions/functions.spec.ts",
                  "hash": "d279c6d96eee06624a6b4734de5b19003e065eeb5f5963436f0b8bfaaf0618f6",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/executors/functions/functions.ts",
                  "hash": "e69680ecd5c09096bc6b91eb2860b8f19391189516f6127e7fdc6d8fb673fe5f",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/executors/functions/schema.d.ts",
                  "hash": "c7badaa02e0b9dbb612e879f9c2243a5647cf282b7cde62736a25fd183d167d9",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/executors/functions/schema.json",
                  "hash": "7dc1d1fe2394a40831e629f54e5a39c843b0f853911ca873aed8d3fa7bd4f742",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/src/generators/application/application.spec.ts",
                  "hash": "de4ebdaae07d10ed1c003a6a281af8a74a9f72f5b44a718717295c9cd5aab0b3",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/generators/application/application.ts",
                  "hash": "011521773a3ce42c770cd0f63d92d6ecb137b27f8c4700c8b04ef9b0f5af81da",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/generators/application/files_workspace/__name__.firebase.json__template__",
                  "hash": "f86b3101a886daf6bd90693203d9b4d229acf0aa242e45a56dddaa883df31b84",
                  "ext": ".json__template__"
               },
               {
                  "file": "packages/nxfirebase/src/generators/application/files/database.rules.json",
                  "hash": "c9bf7f7814b4f00cb9e12837030eeaa2cef530f842737ecc52308be2547ea5a2",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/src/generators/application/files/firestore.indexes.json",
                  "hash": "b3a0a59cbaf9ef04919675f474b5da4cffa7991abbb3d224159a396ae2bea623",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/src/generators/application/files/firestore.rules",
                  "hash": "4f85cbd125cac478e5d257ed9ccc05b5f44d61256c0d84bb7974bddeb69a9268",
                  "ext": ".rules"
               },
               {
                  "file": "packages/nxfirebase/src/generators/application/files/package.json__template__",
                  "hash": "86c55ba51100be448f60bd0fc9598bb09a6fedb2d86a482417da92dec37fac40",
                  "ext": ".json__template__"
               },
               {
                  "file": "packages/nxfirebase/src/generators/application/files/readme.md",
                  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                  "ext": ".md"
               },
               {
                  "file": "packages/nxfirebase/src/generators/application/files/src/index.ts__template__",
                  "hash": "bd49e370fcf8be4d7731e5c60e171694b959a2f28a389e2b04bdc098a419a419",
                  "ext": ".ts__template__"
               },
               {
                  "file": "packages/nxfirebase/src/generators/application/files/storage.rules",
                  "hash": "d0a4772c083f9e34129e34b286474ba74759f30971adc58ba39e78f6be4280e5",
                  "ext": ".rules"
               },
               {
                  "file": "packages/nxfirebase/src/generators/application/files/tsconfig.app.json__template__",
                  "hash": "17c0e33f7b8a6c4d4837c436a184a6794ec3df1d7e673ca09432b7683379cfbe",
                  "ext": ".json__template__"
               },
               {
                  "file": "packages/nxfirebase/src/generators/application/files/tsconfig.json__template__",
                  "hash": "d7cae590088ecd8b6f956ad859973a998c579a406f9bbc51a868235d13e60929",
                  "ext": ".json__template__"
               },
               {
                  "file": "packages/nxfirebase/src/generators/application/schema.d.ts",
                  "hash": "605c709a9d4d4d35989c9c666c3e457eceda622d32c34a8ce3ad856c56750a05",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/generators/application/schema.json",
                  "hash": "b47c4a3d167330c5c3d07872eec53362df38a3a55df778e3d23cd1c99fa0fbd8",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/src/generators/functions/files/package.json",
                  "hash": "a1398630e6931db54f387812ff4bf7c53df81863e7d65b75115eba4c9ea09f85",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/src/generators/functions/files/src/index.ts__template__",
                  "hash": "bd49e370fcf8be4d7731e5c60e171694b959a2f28a389e2b04bdc098a419a419",
                  "ext": ".ts__template__"
               },
               {
                  "file": "packages/nxfirebase/src/generators/functions/files/tsconfig.json",
                  "hash": "695c3f44918df53ae91a3403cfa42965d8394c72c369af8402377cfbfd84533c",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/src/generators/functions/functions.spec.ts",
                  "hash": "f9361d761f1e48b69834b6591e826e7101d60cec60b25bf0c7d9ad93df3aab35",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/generators/functions/functions.ts",
                  "hash": "9494be9866d606bd24d7b6ef23a9c671ee579a20f0cfb29566eee20e21d2d9ad",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/generators/functions/schema.d.ts",
                  "hash": "d178b8334a5231c857d7341b023106f866b0c86e569234d3f27b799337321e57",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/generators/functions/schema.json",
                  "hash": "4071bb429f1549d24ee3ca76b554db721181bf71898f070a698accdd95fa238a",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/src/generators/init/init.spec.ts",
                  "hash": "e7d2e9134fefce8f406dd5f8499462783f09b227b5273e9d2e51b256eb324a1a",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/generators/init/init.ts",
                  "hash": "0252fdf3cb2a42813f2387dd2f39581f536543bc23ff1e85266782dae622ec9a",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/generators/init/schema.d.ts",
                  "hash": "4d2a91eeb700297741efedafa5cd2c91523c513f795a1292c33a8edee9c3fd13",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/src/generators/init/schema.json",
                  "hash": "3c5ee63c070858bfe6b87673a04c267566742714b32b047781dd16ff0e96c939",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/src/index.ts",
                  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
                  "ext": ".ts"
               },
               {
                  "file": "packages/nxfirebase/tsconfig.json",
                  "hash": "edaa6080829e6c133300aba9d42cdf5ff488cccf8399c461e6828c4458c76083",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/tsconfig.lib.json",
                  "hash": "f4fcb97ffdf327c341747e29c5808e111331e914aad429d62e646cda856ee4c8",
                  "ext": ".json"
               },
               {
                  "file": "packages/nxfirebase/tsconfig.spec.json",
                  "hash": "3573805dd869db569c2edb15c7c6e1dd2c4977aab6c86db8a906b3d42932d1dd",
                  "ext": ".json"
               }
            ]
         }
      },
      "nxfirebase-e2e": {
         "name": "nxfirebase-e2e",
         "type": "e2e",
         "data": {
            "projectType": "application",
            "root": "e2e\\nxfirebase-e2e",
            "sourceRoot": "e2e\\nxfirebase-e2e/src",
            "targets": {
               "e2e": {
                  "executor": "@nrwl/nx-plugin:e2e",
                  "options": {
                     "target": "nxfirebase:build",
                     "npmPackageName": "@simondotm/nxfirebase",
                     "pluginOutputPath": "dist/packages/nxfirebase",
                     "jestConfig": "e2e/nxfirebase-e2e/jest.config.js"
                  }
               }
            },
            "tags": [],
            "files": []
         }
      },
      "npm:tslib": {
         "type": "npm",
         "name": "npm:tslib",
         "data": {
            "version": "^2.0.0",
            "packageName": "tslib",
            "files": []
         }
      },
      "npm:@nrwl/cli": {
         "type": "npm",
         "name": "npm:@nrwl/cli",
         "data": {
            "version": "12.1.1",
            "packageName": "@nrwl/cli",
            "files": []
         }
      },
      "npm:@nrwl/devkit": {
         "type": "npm",
         "name": "npm:@nrwl/devkit",
         "data": {
            "version": "12.1.1",
            "packageName": "@nrwl/devkit",
            "files": []
         }
      },
      "npm:@nrwl/eslint-plugin-nx": {
         "type": "npm",
         "name": "npm:@nrwl/eslint-plugin-nx",
         "data": {
            "version": "12.1.1",
            "packageName": "@nrwl/eslint-plugin-nx",
            "files": []
         }
      },
      "npm:@nrwl/jest": {
         "type": "npm",
         "name": "npm:@nrwl/jest",
         "data": {
            "version": "12.1.1",
            "packageName": "@nrwl/jest",
            "files": []
         }
      },
      "npm:@nrwl/linter": {
         "type": "npm",
         "name": "npm:@nrwl/linter",
         "data": {
            "version": "12.1.1",
            "packageName": "@nrwl/linter",
            "files": []
         }
      },
      "npm:@nrwl/node": {
         "type": "npm",
         "name": "npm:@nrwl/node",
         "data": {
            "version": "12.1.1",
            "packageName": "@nrwl/node",
            "files": []
         }
      },
      "npm:@nrwl/nx-plugin": {
         "type": "npm",
         "name": "npm:@nrwl/nx-plugin",
         "data": {
            "version": "12.1.1",
            "packageName": "@nrwl/nx-plugin",
            "files": []
         }
      },
      "npm:@nrwl/tao": {
         "type": "npm",
         "name": "npm:@nrwl/tao",
         "data": {
            "version": "12.1.1",
            "packageName": "@nrwl/tao",
            "files": []
         }
      },
      "npm:@nrwl/workspace": {
         "type": "npm",
         "name": "npm:@nrwl/workspace",
         "data": {
            "version": "12.1.1",
            "packageName": "@nrwl/workspace",
            "files": []
         }
      },
      "npm:@types/jest": {
         "type": "npm",
         "name": "npm:@types/jest",
         "data": {
            "version": "26.0.8",
            "packageName": "@types/jest",
            "files": []
         }
      },
      "npm:@types/node": {
         "type": "npm",
         "name": "npm:@types/node",
         "data": {
            "version": "14.14.33",
            "packageName": "@types/node",
            "files": []
         }
      },
      "npm:@typescript-eslint/eslint-plugin": {
         "type": "npm",
         "name": "npm:@typescript-eslint/eslint-plugin",
         "data": {
            "version": "4.19.0",
            "packageName": "@typescript-eslint/eslint-plugin",
            "files": []
         }
      },
      "npm:@typescript-eslint/parser": {
         "type": "npm",
         "name": "npm:@typescript-eslint/parser",
         "data": {
            "version": "4.19.0",
            "packageName": "@typescript-eslint/parser",
            "files": []
         }
      },
      "npm:dotenv": {
         "type": "npm",
         "name": "npm:dotenv",
         "data": {
            "version": "8.2.0",
            "packageName": "dotenv",
            "files": []
         }
      },
      "npm:eslint": {
         "type": "npm",
         "name": "npm:eslint",
         "data": {
            "version": "7.22.0",
            "packageName": "eslint",
            "files": []
         }
      },
      "npm:eslint-config-prettier": {
         "type": "npm",
         "name": "npm:eslint-config-prettier",
         "data": {
            "version": "8.1.0",
            "packageName": "eslint-config-prettier",
            "files": []
         }
      },
      "npm:jest": {
         "type": "npm",
         "name": "npm:jest",
         "data": {
            "version": "26.2.2",
            "packageName": "jest",
            "files": []
         }
      },
      "npm:prettier": {
         "type": "npm",
         "name": "npm:prettier",
         "data": {
            "version": "2.2.1",
            "packageName": "prettier",
            "files": []
         }
      },
      "npm:ts-jest": {
         "type": "npm",
         "name": "npm:ts-jest",
         "data": {
            "version": "26.5.5",
            "packageName": "ts-jest",
            "files": []
         }
      },
      "npm:ts-node": {
         "type": "npm",
         "name": "npm:ts-node",
         "data": {
            "version": "~9.1.1",
            "packageName": "ts-node",
            "files": []
         }
      },
      "npm:typescript": {
         "type": "npm",
         "name": "npm:typescript",
         "data": {
            "version": "~4.1.4",
            "packageName": "typescript",
            "files": []
         }
      }
   },
   "dependencies": {
      "nxfirebase": [
         {
            "type": "static",
            "source": "nxfirebase",
            "target": "npm:@nrwl/devkit"
         },
         {
            "type": "static",
            "source": "nxfirebase",
            "target": "npm:@nrwl/workspace"
         }
      ],
      "nxfirebase-e2e": [
         {
            "type": "implicit",
            "source": "nxfirebase-e2e",
            "target": "nxfirebase"
         }
      ],
      "npm:tslib": [],
      "npm:@nrwl/cli": [],
      "npm:@nrwl/devkit": [],
      "npm:@nrwl/eslint-plugin-nx": [],
      "npm:@nrwl/jest": [],
      "npm:@nrwl/linter": [],
      "npm:@nrwl/node": [],
      "npm:@nrwl/nx-plugin": [],
      "npm:@nrwl/tao": [],
      "npm:@nrwl/workspace": [],
      "npm:@types/jest": [],
      "npm:@types/node": [],
      "npm:@typescript-eslint/eslint-plugin": [],
      "npm:@typescript-eslint/parser": [],
      "npm:dotenv": [],
      "npm:eslint": [],
      "npm:eslint-config-prettier": [],
      "npm:jest": [],
      "npm:prettier": [],
      "npm:ts-jest": [],
      "npm:ts-node": [],
      "npm:typescript": []
   },
   "allWorkspaceFiles": [
      {
         "file": ".editorconfig",
         "hash": "3970ce473928bdf945236b8aa6c7cbf6b0022f5ce379b7b0ba8e7343d8fec451",
         "ext": ""
      },
      {
         "file": ".eslintrc.json",
         "hash": "ce764c60ea27b190bfc7c5a49d94aaa869f715ccf48d17f5d181a3ba702e09db",
         "ext": ".json"
      },
      {
         "file": ".gitignore",
         "hash": "40295e4ab26a0d6bdb4d565dd027abff43b606f7b2490a47b0a7e839067fc6f4",
         "ext": ""
      },
      {
         "file": ".prettierignore",
         "hash": "f95c3c93225db6ab0cafe5c4992521c0dbfa2afb4966642d8bdb378c4d62510f",
         "ext": ""
      },
      {
         "file": ".prettierrc",
         "hash": "a93a9720aae9e8b417993b3c7979a0c805c38536975116604b0189db8612cea2",
         "ext": ""
      },
      {
         "file": "e2e/nxfirebase-e2e/jest.config.js",
         "hash": "edc924df4e6e68559fc8e3b7b94f7414876ca09f3c4c4834d1af48d36ffe77d2",
         "ext": ".js"
      },
      {
         "file": "e2e/nxfirebase-e2e/tests/nxfirebase.spec.ts",
         "hash": "10f2221d59679d29d1f1c7b6bca9588342b6fa2183f35a834fd1f05434754ac5",
         "ext": ".ts"
      },
      {
         "file": "e2e/nxfirebase-e2e/tsconfig.json",
         "hash": "4b5780945cbeaa5c0aba2dd3f51846c467790bd81e6896f776ef9034561a6afe",
         "ext": ".json"
      },
      {
         "file": "e2e/nxfirebase-e2e/tsconfig.spec.json",
         "hash": "892d0d0d55d71a8f412e2641cb7e304047bcd62da1fe253d46b92ceda4aee6b3",
         "ext": ".json"
      },
      {
         "file": "jest.config.js",
         "hash": "0bbbea760cb66b0ddc2595f976ca41946250687cb95f7319835c5f20299c45eb",
         "ext": ".js"
      },
      {
         "file": "jest.preset.js",
         "hash": "e0d37a0e114f07a170252495e9039496b424950d1d010d1dd08a4214573640e6",
         "ext": ".js"
      },
      {
         "file": "LICENSE",
         "hash": "78b6bd9956870c26a925aab66aa8ee5d911dd39431fe298c0d1fbf0a98e5130a",
         "ext": ""
      },
      {
         "file": "migrations.json",
         "hash": "86275c210ffda57549e3c9cdb14018847961ac6d682a0b835f836019bdae3ed3",
         "ext": ".json"
      },
      {
         "file": "nx.json",
         "hash": "cd94d6621ce0084122ea33341609f5a46228ceae7a9f1338da6ec67660e89495",
         "ext": ".json"
      },
      {
         "file": "nx.json",
         "hash": "cd94d6621ce0084122ea33341609f5a46228ceae7a9f1338da6ec67660e89495",
         "ext": ".json"
      },
      {
         "file": "package-lock.json",
         "hash": "2a4ac70dbd4de3145b3242f529371d639933cbdb42ebf59ba7e0d6e4b291595c",
         "ext": ".json"
      },
      {
         "file": "package.json",
         "hash": "02c31b4ea959076aec93b82bacdc6d7aadb7d50020356f9a5ba5e950b2dbe00f",
         "ext": ".json"
      },
      {
         "file": "package.json",
         "hash": "02c31b4ea959076aec93b82bacdc6d7aadb7d50020356f9a5ba5e950b2dbe00f",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/.babelrc",
         "hash": "9065e090995b88f1c498325e875aee5fa5127faea2bc80a2167813700a1da429",
         "ext": ""
      },
      {
         "file": "packages/nxfirebase/.eslintrc.json",
         "hash": "c9a85022f69e3f8cf316ebf26ee06e424fddf5c067e0ebb6574dfad85158b41d",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/executors.json",
         "hash": "47065ad9bf87d99be693ccb0213b0302a88f6b05de94b7374bc491ce4df6073c",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/generators.json",
         "hash": "37406f52f207546a9bdf90f358202dec6d2f32c4615d661d05715261da29a846",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/jest.config.js",
         "hash": "be5c8b1440d319b53a2704c16b47ec289ef34dfc4654aac4cad43a6d89d26afa",
         "ext": ".js"
      },
      {
         "file": "packages/nxfirebase/notes.md",
         "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
         "ext": ".md"
      },
      {
         "file": "packages/nxfirebase/package.json",
         "hash": "f3205645d7ce21312854d68d04562f78ecc9d7ad17e573191332260a5a09463f",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/README.md",
         "hash": "6143c7e5789fe6260c4e14bb18c2fd99995787734c2ebee3b224e93786c90d53",
         "ext": ".md"
      },
      {
         "file": "packages/nxfirebase/src/executors/build/executor.spec.ts",
         "hash": "d279c6d96eee06624a6b4734de5b19003e065eeb5f5963436f0b8bfaaf0618f6",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/executors/build/executor.ts",
         "hash": "f0a4a1e14cb92921f2daacd45cabc5d0c12a305c790ae71ef3365464ff1ba431",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/executors/build/schema.d.ts",
         "hash": "24025354749a21432bad1706394598e64578ce964d905de4c406da5b895cc68a",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/executors/build/schema.json",
         "hash": "7dc1d1fe2394a40831e629f54e5a39c843b0f853911ca873aed8d3fa7bd4f742",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/src/executors/functions/functions.spec.ts",
         "hash": "d279c6d96eee06624a6b4734de5b19003e065eeb5f5963436f0b8bfaaf0618f6",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/executors/functions/functions.ts",
         "hash": "e69680ecd5c09096bc6b91eb2860b8f19391189516f6127e7fdc6d8fb673fe5f",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/executors/functions/schema.d.ts",
         "hash": "c7badaa02e0b9dbb612e879f9c2243a5647cf282b7cde62736a25fd183d167d9",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/executors/functions/schema.json",
         "hash": "7dc1d1fe2394a40831e629f54e5a39c843b0f853911ca873aed8d3fa7bd4f742",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/src/generators/application/application.spec.ts",
         "hash": "de4ebdaae07d10ed1c003a6a281af8a74a9f72f5b44a718717295c9cd5aab0b3",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/generators/application/application.ts",
         "hash": "011521773a3ce42c770cd0f63d92d6ecb137b27f8c4700c8b04ef9b0f5af81da",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/generators/application/files_workspace/__name__.firebase.json__template__",
         "hash": "f86b3101a886daf6bd90693203d9b4d229acf0aa242e45a56dddaa883df31b84",
         "ext": ".json__template__"
      },
      {
         "file": "packages/nxfirebase/src/generators/application/files/database.rules.json",
         "hash": "c9bf7f7814b4f00cb9e12837030eeaa2cef530f842737ecc52308be2547ea5a2",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/src/generators/application/files/firestore.indexes.json",
         "hash": "b3a0a59cbaf9ef04919675f474b5da4cffa7991abbb3d224159a396ae2bea623",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/src/generators/application/files/firestore.rules",
         "hash": "4f85cbd125cac478e5d257ed9ccc05b5f44d61256c0d84bb7974bddeb69a9268",
         "ext": ".rules"
      },
      {
         "file": "packages/nxfirebase/src/generators/application/files/package.json__template__",
         "hash": "86c55ba51100be448f60bd0fc9598bb09a6fedb2d86a482417da92dec37fac40",
         "ext": ".json__template__"
      },
      {
         "file": "packages/nxfirebase/src/generators/application/files/readme.md",
         "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
         "ext": ".md"
      },
      {
         "file": "packages/nxfirebase/src/generators/application/files/src/index.ts__template__",
         "hash": "bd49e370fcf8be4d7731e5c60e171694b959a2f28a389e2b04bdc098a419a419",
         "ext": ".ts__template__"
      },
      {
         "file": "packages/nxfirebase/src/generators/application/files/storage.rules",
         "hash": "d0a4772c083f9e34129e34b286474ba74759f30971adc58ba39e78f6be4280e5",
         "ext": ".rules"
      },
      {
         "file": "packages/nxfirebase/src/generators/application/files/tsconfig.app.json__template__",
         "hash": "17c0e33f7b8a6c4d4837c436a184a6794ec3df1d7e673ca09432b7683379cfbe",
         "ext": ".json__template__"
      },
      {
         "file": "packages/nxfirebase/src/generators/application/files/tsconfig.json__template__",
         "hash": "d7cae590088ecd8b6f956ad859973a998c579a406f9bbc51a868235d13e60929",
         "ext": ".json__template__"
      },
      {
         "file": "packages/nxfirebase/src/generators/application/schema.d.ts",
         "hash": "605c709a9d4d4d35989c9c666c3e457eceda622d32c34a8ce3ad856c56750a05",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/generators/application/schema.json",
         "hash": "b47c4a3d167330c5c3d07872eec53362df38a3a55df778e3d23cd1c99fa0fbd8",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/src/generators/functions/files/package.json",
         "hash": "a1398630e6931db54f387812ff4bf7c53df81863e7d65b75115eba4c9ea09f85",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/src/generators/functions/files/src/index.ts__template__",
         "hash": "bd49e370fcf8be4d7731e5c60e171694b959a2f28a389e2b04bdc098a419a419",
         "ext": ".ts__template__"
      },
      {
         "file": "packages/nxfirebase/src/generators/functions/files/tsconfig.json",
         "hash": "695c3f44918df53ae91a3403cfa42965d8394c72c369af8402377cfbfd84533c",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/src/generators/functions/functions.spec.ts",
         "hash": "f9361d761f1e48b69834b6591e826e7101d60cec60b25bf0c7d9ad93df3aab35",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/generators/functions/functions.ts",
         "hash": "9494be9866d606bd24d7b6ef23a9c671ee579a20f0cfb29566eee20e21d2d9ad",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/generators/functions/schema.d.ts",
         "hash": "d178b8334a5231c857d7341b023106f866b0c86e569234d3f27b799337321e57",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/generators/functions/schema.json",
         "hash": "4071bb429f1549d24ee3ca76b554db721181bf71898f070a698accdd95fa238a",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/src/generators/init/init.spec.ts",
         "hash": "e7d2e9134fefce8f406dd5f8499462783f09b227b5273e9d2e51b256eb324a1a",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/generators/init/init.ts",
         "hash": "0252fdf3cb2a42813f2387dd2f39581f536543bc23ff1e85266782dae622ec9a",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/generators/init/schema.d.ts",
         "hash": "4d2a91eeb700297741efedafa5cd2c91523c513f795a1292c33a8edee9c3fd13",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/src/generators/init/schema.json",
         "hash": "3c5ee63c070858bfe6b87673a04c267566742714b32b047781dd16ff0e96c939",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/src/index.ts",
         "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
         "ext": ".ts"
      },
      {
         "file": "packages/nxfirebase/tsconfig.json",
         "hash": "edaa6080829e6c133300aba9d42cdf5ff488cccf8399c461e6828c4458c76083",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/tsconfig.lib.json",
         "hash": "f4fcb97ffdf327c341747e29c5808e111331e914aad429d62e646cda856ee4c8",
         "ext": ".json"
      },
      {
         "file": "packages/nxfirebase/tsconfig.spec.json",
         "hash": "3573805dd869db569c2edb15c7c6e1dd2c4977aab6c86db8a906b3d42932d1dd",
         "ext": ".json"
      },
      {
         "file": "README-Nx.md",
         "hash": "a769e0413f3f894e03a6fff799c14dd99ed4ff2b2a4d8ac3b0ff86c5f671323c",
         "ext": ".md"
      },
      {
         "file": "README.md",
         "hash": "387e129457392dd207bc0259234d6659ae7ac9dcbaaf4ad863630357ca0123cd",
         "ext": ".md"
      },
      {
         "file": "tools/generators/.gitkeep",
         "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
         "ext": ""
      },
      {
         "file": "tools/tsconfig.tools.json",
         "hash": "45f5456ebfb8cd8e1e57f75f7e80394a2a590ae50b54d19028617ec3c9325c93",
         "ext": ".json"
      },
      {
         "file": "tsconfig.base.json",
         "hash": "af90c83f1726778e31d12628ac8bbb5dde5a0429494ae7d128ec51045fc4d1ae",
         "ext": ".json"
      },
      {
         "file": "tsconfig.base.json",
         "hash": "af90c83f1726778e31d12628ac8bbb5dde5a0429494ae7d128ec51045fc4d1ae",
         "ext": ".json"
      },
      {
         "file": "workspace.json",
         "hash": "3b599a983377042170257e3fe76d3a14e4224169456ee07131cf002b80a2a771",
         "ext": ".json"
      },
      {
         "file": "workspace.json",
         "hash": "3b599a983377042170257e3fe76d3a14e4224169456ee07131cf002b80a2a771",
         "ext": ".json"
      }
   ]
}
target=undefined
dependencies=[]

———————————————————————————————————————————————

>  NX   SUCCESS  Running target "functions" succeeded


