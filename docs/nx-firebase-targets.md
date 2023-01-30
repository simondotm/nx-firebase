# Nx-Firebase Targets

This document provides examples of how the firebase application `project.json` can be configured with targets.

- [Nx-Firebase Targets](#nx-firebase-targets)
  - [Build Target](#build-target)
  - [GetConfig Target](#getconfig-target)
  - [Emulate Target](#emulate-target)
  - [Serve Target](#serve-target)
  - [Deploy Target](#deploy-target)
  - [Lint, Test Targets](#lint-test-targets)
  - [Project Configuration](#project-configuration)
- [Experimental](#experimental)
    - [Build Target using Webpack bundler (EXPERIMENTAL)](#build-target-using-webpack-bundler-experimental)
    - [Build Target using esbuild bundler (EXPERIMENTAL)](#build-target-using-esbuild-bundler-experimental)
  - [Firebase Projects Config](#firebase-projects-config)

## Build Target

- Builds the Firebase functions project as a `@nrwl/js:tsc` node application.
- The `package.json` in the output directory is updated with project dependencies and local library depedencies.
- Running this build with `nx run functions:build --watch` will only watch the main application code; it **does not** detect changes to imported library projects.

```
"build": {
  "executor": "@simondotm/nx-firebase:build",
  "outputs": ["{options.outputPath}"],
  "options": {
    "outputPath": "dist/apps/functions",
    "main": "apps/functions/src/index.ts",
    "tsConfig": "apps/functions/tsconfig.app.json",
    "packageJson": "apps/functions/package.json",
    "assets": []
  }
}
```

## GetConfig Target

Fetches the remote firebase project config and stores it locally in the application folder as `.runtimeconfig.json` (This file is ignored by Nx and git).

```
"getconfig": {
  "executor": "nx:run-commands",
  "options": {
    "command": "firebase functions:config:get --config firebase.functions.json --project my-project > apps/functions/.runtimeconfig.json"
  }
}
```

**Nx workspaces prior to version 14.8.0**

```
"getconfig": {
  "executor": "@nrwl/workspace:run-commands",
  "options": {
    "command": "firebase functions:config:get --config firebase.functions.json --project my-project > apps/functions/.runtimeconfig.json"
  }
}
```

## Emulate Target

Starts the firebase emulator:

- Waits 5 seconds (this allows the `serve` command time to complete first build)
- Closes any leftover ports still in use from a previous emulation session
- Fetches the remote config and stores it in the application dist folder so it is accessible by the emulator
- Starts the firebase emulator

```
"emulate": {
  "executor": "nx:run-commands",
  "options": {
    "commands": [
      "node -e 'setTimeout(()=>{},5000)'",
      "kill-port --port 9099,5001,8080,9000,5000,8085,9199,9299,4000,4400,4500",
      "firebase functions:config:get --config firebase.functions.json --project my-project > dist/functions/.runtimeconfig.json",
      "firebase emulators:start  --config firebase.json"
    ],
    "parallel": false
  }
}
```

**Nx workspaces prior to version 14.8.0**

```
"emulate": {
  "executor": "@nrwl/workspace:run-commands",
  "options": {
    "commands": [
      "node -e 'setTimeout(()=>{},5000)'",
      "kill-port --port 9099,5001,8080,9000,5000,8085,9199,9299,4000,4400,4500",
      "firebase functions:config:get --config firebase.functions.json --project my-project > dist/functions/.runtimeconfig.json",
      "firebase emulators:start  --config firebase.json"
    ],
    "parallel": false
  }
}
```

## Serve Target

Builds the firebase application and then starts an Nx `watch` on the project, then starts the `emulate` target.

Note that when using the Typescript builder, changes to library dependencies **will** be detected.

```
"serve": {
  "executor": "nx:run-commands",
  "options": {
    "commands": [
      "nx run functions:build && nx watch --projects=functions --includeDependentProjects -- nx build functions --clean=false",
      "nx run functions:emulate"
    ],
    "parallel": true
  }
}
```

**Nx workspaces prior to version 15.4.0**

Builds the firebase application in `watch` mode, and starts the `emulate` target.

Note that when using the Typescript builder, changes to library dependencies **will not** be detected.

```
"serve": {
  "executor": "nx:run-commands",
  "options": {
    "commands": [
      "nx run functions:build --watch",
      "nx run functions:emulate"
    ],
    "parallel": true
  }
}
```

**Nx workspaces prior to version 14.8.0**

```
"serve": {
  "executor": "@nrwl/workspace:run-commands",
  "options": {
    "commands": [
      "nx run functions:build --watch",
      "nx run functions:emulate"
    ],
    "parallel": true
  }
}
```

## Deploy Target

```
"deploy": {
  "executor": "nx:run-commands",
  "options": {
    "command": "firebase deploy --config firebase.functions.json --project my-project"
  }
}
```

**Nx workspaces prior to version 14.8.0**

```
"deploy": {
  "executor": "@nrwl/workspace:run-commands",
  "options": {
    "command": "firebase deploy --config firebase.functions.json --project my-project"
  }
}
```

## Lint, Test Targets

Since the firebase application is a buildable Typescript project, it also contains the same lint & test targets as any typical Typescript buildable project.

## Project Configuration

A sample `project.json` file for an `nx-firebase` application project looks like this:

```
{
  ...
  "targets": {
    "build": { ... },
    "serve": { ... },
    "deploy": { ... },
    "getconfig": { ... },
    "emulate": { ... },
    "lint": { ... },
    "test": { ... }
  },
  "tags": []
}

```

# Experimental

### Build Target using Webpack bundler (EXPERIMENTAL)

Bundles the Firebase functions project using `@nrwl/node:webpack`. For this to work:

- Make sure your project `package.json` does not have a `main` property set.
- Your project cannot use dynamic imports via `require`
- `fileReplacements` is optional if you need different files for a production build
- Running `nx run functions:build --watch` with this target **does** support automatic rebuilds if dependent libraries change

```
"build": {
  "executor": "@nrwl/node:webpack",
  "outputs": [
    "{options.outputPath}"
  ],
  "options": {
    "outputPath": "dist/apps/functions",
    "main": "apps/functions/src/index.ts",
    "tsConfig": "apps/functions/tsconfig.app.json",
    "buildLibsFromSource": true,
    "generatePackageJson": true,
    "assets": []
  },
  "configurations": {
    "production": {
      "optimization": true,
      "extractLicenses": true,
      "inspect": false,
      "fileReplacements": [
        {
          "replace": "apps/functions/src/environments/environment.ts",
          "with": "apps/functions/src/environments/environment.prod.ts"
        }
      ]
    }
  }
},
```

### Build Target using esbuild bundler (EXPERIMENTAL)

Bundles the Firebase functions project using `@nrwl/esbuild:esbuild`. For this to work:

- Make sure your project `package.json` does not have a `main` property set.
- Your project cannot use dynamic imports via `require`
- Would recommend your project is using ES6 modules rather than commonjs for tree shaking to work
- Recommend Nx 15.5.3+
- Documentation [here](https://nx.dev/packages/esbuild/executors/esbuild)
- Unclear from documentation if it updates the `package.json` but it [looks like it does](https://github.com/nrwl/nx/blob/7285ee50fca7136f38ce159ef3ed2977b8e7816a/packages/js/src/utils/package-json/index.ts#L23)
- This build type has not been tried, so only theoretical atm

```
"build": {
  "executor": "@nrwl/esbuild:esbuild",
  "outputs": [
    "{options.outputPath}"
  ],
  "options": {
    "outputPath": "dist/apps/functions",
    "format": ["esm"],
    "main": "apps/functions/src/index.ts",
    "tsConfig": "apps/functions/tsconfig.app.json",
    "buildLibsFromSource": true,
    "generatePackageJson": true,
    "assets": []
  },
  "configurations": {
    "production": {
      "optimization": true,
      "extractLicenses": true,
      "inspect": false,
      "fileReplacements": [
        {
          "replace": "apps/functions/src/environments/environment.ts",
          "with": "apps/functions/src/environments/environment.prod.ts"
        }
      ]
    }
  }
},
```

## Firebase Projects Config

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
