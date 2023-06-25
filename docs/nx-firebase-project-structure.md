# Nx-Firebase `project.json` structures (v2)

## Firebase Applications

```
{
  "name": "your-firebase-project-name",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "nx:run-commands",
      "options": {
        "command": "echo Build succeeded."
      }
    },
    "watch": {
      "executor": "nx:run-commands",
      "options": {
        "command": "nx run-many --targets=build --projects=tag:firebase:dep:your-firebase-project-name --parallel=100 --watch"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "nx run-many --targets=lint --projects=tag:firebase:dep:your-firebase-project-name --parallel=100"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "nx run-many --targets=test --projects=tag:firebase:dep:your-firebase-project-name --parallel=100"
      }
    },
    "firebase": {
      "executor": "nx:run-commands",
      "options": {
        "command": "firebase --config=<your-firebase-project-config> --project=<your-firebase-projectid>"
      },
      "configurations": {
        "production": {
          "command": "firebase --config=<your-firebase-project-config> --project=<your-firebase-production-projectid>"
        }
      }
    },
    "killports": {
      "executor": "nx:run-commands",
      "options": {
        "command": "kill-port --port 9099,5001,8080,9000,5000,8085,9199,9299,4000,4400,4500"
      }
    },
    "getconfig": {
      "executor": "nx:run-commands",
      "options": {
        "command": "nx run your-firebase-project-name:firebase functions:config:get > apps/your-firebase-project-name/.runtimeconfig.json"
      }
    },
    "emulate": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "nx run your-firebase-project-name:killports",
          "nx run your-firebase-project-name:firebase emulators:start --import=apps/your-firebase-project-name/.emulators --export-on-exit"
        ],
        "parallel": false
      }
    },
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "nx run your-firebase-project-name:watch",
          "nx run your-firebase-project-name:emulate"
        ]
      }
    },
    "deploy": {
      "executor": "nx:run-commands",
      "dependsOn": [
        "build"
      ],
      "options": {
        "command": "nx run your-firebase-project-name:firebase deploy"
      }
    }
  },
  "tags": [
    "firebase:app",
    "firebase:name:your-firebase-project-name"
  ]
}
```

## Firebase Functions

```
{
  "name": "your-firebase-function-project-name",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/your-firebase-function-project-name/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "@nx/esbuild:esbuild",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/your-firebase-function-project-name",
        "main": "apps/your-firebase-function-project-name/src/main.ts",
        "tsConfig": "apps/your-firebase-function-project-name/tsconfig.app.json",
        "assets": ["apps/your-firebase-function-project-name/src/assets"],
        "generatePackageJson": true,
        "platform": "node",
        "bundle": true,
        "thirdParty": false,
        "dependenciesFieldType": "dependencies",
        "target": "node16",
        "format": ["esm"],
        "esbuildOptions": {
          "logLevel": "info"
        }
      }
    },
    "lint": {
      "executor": "@nx/linter:eslint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/your-firebase-function-project-name/**/*.ts"]
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "apps/your-firebase-function-project-name/jest.config.ts",
        "passWithNoTests": true
      },
      "configurations": {
        "ci": {
          "ci": true,
          "codeCoverage": true
        }
      }
    },
    "deploy": {
      "executor": "nx:run-commands",
      "options": {
        "command": "nx run your-firebase-project-name:deploy --only functions:your-firebase-function-project-name"
      },
      "dependsOn": ["build"]
    }
  },
  "tags": [
    "firebase:function",
    "firebase:name:your-firebase-function-project-name",
    "firebase:dep:your-firebase-project-name"
  ]
}

```
