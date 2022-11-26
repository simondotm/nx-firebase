# @simondotm/nx-firebase Changelog

All notable changes to this project will be documented in this file.

## v0.3.3

**General changes**

- Improved listing of firebase functions dependencies; now ordered by npm module libraries first, then local libraries, sorted alphabetically.

**Enhanced Support for Firebase Emulators**

`nx g @simondotm/nx-firebase:app` generator now additionally:

- Adds default `auth` and `pubsub` settings to `"emulators": {...}` config in `firebase.<appname>.json` so that these services are also emulated by default.

- Adds a new `getconfig` target to firebase functions app, where:

  - `nx getconfig <firebaseappname>` will fetch the [functions configuration variables](https://firebase.google.com/docs/functions/local-emulator#set_up_functions_configuration_optional) from the server and store it locally as `.runtimeconfig.json`

- Adds `.runtimeconfig.json` to asset list to be copied (if it exists) from app directory to output `dist` directory when built, so that the function emulators will now run if the functions being emulated access variables from the functions config.

- Adds `.runtimeconfig.json` to the Nx workspace root `.gitignore` file (if not already added), since these files should not be version controlled

- Adds an `emulate` target to the Nx-firebase app, which is used by `serve` but also allows Firebase emulators to be started independently of a watched build.

**Plugin maintenance**

- Executors use workspace logger routines instead of console
- Fixed minor issues in e2e tests
- Removed redundant/legacy firebase target
- Replaced plugin use of node `join` with workspace `joinPathFragments`

**Migration from v0.3.2**

For users with existing nx-firebase applications in their workspace you may wish to add the new version schema updates manually to your workspace configuration files.

In your `angular.json` or `workspace.json` file, for each `nx-firebase` app project:

1. Add the `.runtimeconfig.json` to your build assets:

```
      "targets": {
        "build": {
          ...
          "options": {
            ...
            "assets": [
              ...
              "apps/nxfirebase-root-app/.runtimeconfig.json"
            ]
          }
        },
```

2. Add the new `emulate` target to your app:

```
      "targets": {
        ...
        "emulate": {
          "executor": "@nrwl/workspace:run-commands",
          "options": {
            "command": "firebase emulators:start --config firebase.nxfirebase-root-app.json"
          }
        },
```

3. Modify the `serve` target to:

```
      "targets": {
        ...
        "serve": {
          ...
          "options": {
            "commands": [
              {
                "command": "nx run <appname>:build --with-deps && nx run <appname>:build --watch"
              },
              {
                "command": "nx run <appname>:emulate"
              }
            ],
            "parallel": true
          }
        },
```

4. Add the new `getconfig` target:

```
      "targets": {
        ...
        "getconfig": {
          "executor": "@nrwl/workspace:run-commands",
          "options": {
            "command": "firebase functions:config:get --config firebase.<appname>.json > apps/<path-to-app>/.runtimeconfig.json"
          }
        },
        ...
```

And in your `firebase.<appname>.json` config settings for `"emulators"` add `"auth"` and `"pubsub"` configs:

```
    "emulators": {
        ...
        "auth": {
            "port": 9099
        },
        "pubsub": {
            "port": 8085
        }
    }
```

## v0.3.2

- Plugin now detects incompatible Nx library dependencies and aborts compilation when found

Incompatible dependencies are as follows:

1. Non `--buildable` libraries
2. Nested libraries that were not created with `--importPath`

If either of these two types of libraries are imported by Firebase functions, the compilation will be halted, since a functional app cannot be created with these types of dependencies.

See the [README](README.md#using-nx-libraries-within-nested-sub-directories) for more information.

## v0.3.1

- Removed undocumented/unusued `firebase` target in app generator. No longer needed.

- `serve` target now builds `--with-deps` before watching to ensure all dependent local libraries are built. Note that `serve` only detects incremental changes to the main application, and not dependent libraries as well at this time.

## v0.3.0

Project has been renamed from `@simondotm/nxfirebase` to `@simondotm/nx-firebase` to better match Nx plugin naming conventions. Took a deep breath and did it early before many installs occurred. Apologies to any users who this may have inconvenienced - I didn't realise I could deprecate packages until after I'd deleted & renamed the pnm project. Rest assured, I won't be making any further major modifications like this!

If you have already generated NxFirebase applications using `@simondotm/nxfirebase` you will need to migrate as follows:

1. `npm uninstall @simondotm/nxfirebase`
2. `npm install @simondotm/nx-firebase --save-dev`
3. Update the `builder` targets in any NxFirebase applications you already have in your `workspace.json` or `angular.json` config from `@simondotm/nxfirebase:build` to `@simondotm/nx-firebase:build`

## v0.2.3

Built against Nx 12.3.4

**Updates**

- `build` executor now supports `--watch` option for incremental builds

- Added `serve` target to applications which will build the application with `--with-deps` and `--watch` options, and also launch the Firebase emulator with the application's firebase configuration in parallel

- Added `deploy` target to applications. Supports Nx forwarded command line arguments so commands like `nx deploy <appname> --only functions` work fine

- Default template function `index.ts` now has added import of `firebase-admin` to ensure all necessary Firebase package dependencies for functions are included out of the box

**Fixes**

- Default `firebase.appname.json` now has a valid default hosting configuration and apps ship with a template `public/index.html` (as generated by Firebase CLI) inside the application folder

- Nx-Firebase App generator sets `target` in `tsconfig.app.ts` to `es2018` to ensure Node 10 compatibility for Firebase Functions (for scenarios where root workspace `tsconfig.base.json` may be set to a later ES target)

- Fixed `predeploy` scripts in `firebase.appname.json` to use `npx nx` so that they work correctly in CI environments

- Fixed default `firestore.rules` file to correct a typo

- Fixed default `storage.rules` file to use version 2 ruleset

- Plugin peer dependencies set so there's some indication of plugin compatibility

**Migrating from apps generated with v0.2.2**

v0.2.3 adds these targets to your `workspace.json` or `angular.json`, so for users of earlier versions of the plugin this will have to be done manually:

```
                "serve": {
                    "builder": "@nrwl/workspace:run-commands",
                    "options": {
                        "commands": [
                            {
                                "command": "nx run <appname>:build --with-deps && nx run <appname>:build --watch"
                            },
                            {
                                "command": "firebase emulators:start --config firebase.<appname>.json"
                            }
                        ],
                        "parallel": true
                    }
                },
                "deploy": {
                    "builder": "@nrwl/workspace:run-commands",
                    "options": {
                        "command": "firebase deploy --config firebase.<appname>.json"
                    }
                },
```

## v0.2.2 - Initial Release

Built against Nx 12.1.1
