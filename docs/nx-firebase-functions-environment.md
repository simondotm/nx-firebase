# Firebase Function Environment Variables

## Overview
Firebase functions can make use of environment variables in their runtime.

The Nx-firebase [application generator](./nx-firebase-applications.md) will automatically create default function environment files for you to use:

- `environment/.env`
- `environment/.env.local`
- `environment/.secret.local`

If you run the `getconfig` target, it will place `.runtimeconfig.json` file in the `environment` folder also.

These environment files are considered common to all of your functions by nx-firebase, and are copied from your firebase app's `environment` folder to your function's `dist` folder when the function is built. 

This ensures they are available for deployment and emulation.

All functions share the same environment variable files.


## Environment file types

| File | Description | Git Ignored | Deployed |
| --- | --- | --- | --- |
| `.env` | [General environment variables for functions](https://firebase.google.com/docs/functions/config-env?gen=2nd#env-variables) | - | Yes |
| `.env.local` | [Environment variable overrides for function emulation](https://firebase.google.com/docs/functions/config-env?gen=2nd#emulator_support) | - | - |
| `.env.<project-alias>` | [Environment variable overrides for specific deployment targets (eg. dev/prod)](https://firebase.google.com/docs/functions/config-env?gen=2nd#deploying_multiple_sets_of_environment_variables) | - | Yes |
| `.secret.local` | [Secrets only for function emulation](https://firebase.google.com/docs/functions/config-env?gen=2nd#secrets_and_credentials_in_the_emulator) | Yes | - |
| `.runtimeconfig.json` | [Function configurations](https://firebase.google.com/docs/cli#functions-commands) | Yes | - |

> _Note that the Firebase team appear to be deprecating the use of `.runtimeconfig.json` function configs and recommending migration to dotenv environment variables._



## Deployed Files

The firebase CLI will deploy `.env` and/or `.env.<project-id>` files along with function code, and they can be version controlled.

## Non-deployed files

`.env.local` and `.secret.local` files are excluded from deployment by using an `functions.ignore` rule in `firebase.json`.

## Local Files

`.secret.local` and `.env.local` are only used by the Firebase emulator suite.

`.secret.local` and `.runtimeconfig.json` should not be version controlled, and are both git ignored, but included in Nx dependency graph using a `.nxignore` override.





