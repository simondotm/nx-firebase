# Nx-Firebase Targets

A sample `project.json` file for an `nx-firebase` application project looks like this:

```
{
  "name": "functions",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/functions/src",
  "projectType": "application",
  "targets": {
    "build": {
      "executor": "@simondotm/nx-firebase:build",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/apps/functions",
        "main": "apps/functions/src/index.ts",
        "tsConfig": "apps/functions/tsconfig.app.json",
        "packageJson": "apps/functions/package.json",
        "assets": [
          "apps/functions/*.md",
          "apps/functions/.runtimeconfig.json"
        ]
      }
    },
    "serve": {
      "executor": "nx:run-commands",
      "options": {
        "commands": [
          "nx run functions:build --watch",
          "nx run functions:emulate"
        ]
      }
    },
    "lint": {
      "executor": "@nrwl/linter:eslint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["apps/functions/**/*.ts"]
      }
    },
    "test": {
      "executor": "@nrwl/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "apps/functions/jest.config.ts",
        "passWithNoTests": true
      }
    },
    "deploy": {
      "executor": "nx:run-commands",
      "options": {
        "command": "firebase deploy --config firebase.functions.json --project my-project"
      }
    },
    "getconfig": {
      "executor": "nx:run-commands",
      "options": {
        "command": "firebase functions:config:get --config firebase.functions.json --project my-project > apps/functions/.runtimeconfig.json"
      }
    },
    "emulate": {
      "executor": "nx:run-commands",
      "options": {
        "command": "firebase emulators:start --config firebase.functions.json"
      }
    }
  },
  "tags": []
}

```

where `.firebaserc` defines project aliases such as:

```
{
  "projects": {
    "default": "my-firebase-project-id",
    "my-firebase-project": "my-firebase-project-id"
  }
}
```

and `functions` configuration object in `firebase.functions2.json` is:

```
  "functions": {
    "codebase": "functions2",
    "predeploy": ["npx nx build functions2", "npx nx lint functions2"],
    "runtime": "nodejs16",
    "source": "dist/apps/functions2"
  }
```
