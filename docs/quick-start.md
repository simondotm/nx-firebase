# Quick Start

- [Quick Start](#quick-start)
  - [Install Plugin](#install-plugin)
  - [Create Firebase Application](#create-firebase-application)
  - [Build Project](#build-project)
  - [Deploy Project (Firebase functions)](#deploy-project-firebase-functions)
  - [Serve Project](#serve-project)
  - [Get Remote Functions Config](#get-remote-functions-config)

## Install Plugin

**`npm install @simondotm/nx-firebase`**

- Installs this plugin into your Nx workspace.
- This will also install some Nx and firebase dependencies (both for backend and frontend) to your root workspace `package.json` if they are not already installed.
- The plugin is compatible with Nx versions 13.10.6 or above

## Create Firebase Application

**`nx g @simondotm/nx-firebase:app <appname> [--directory=dir] [--project=proj]`**

- Generates a new Nx Firebase application in the workspace - `/apps/[dir]/appname`
- The app generator will also create a Firebase configuration file in the root of your workspace (along with a default `.firebaserc` and `firebase.json` if they don't already exist).
- For the first firebase application you create, the project firebase configuration will be `firebase.json`.
- If you create additional firebase applications, the project firebase configuration will be `firebase.<appname>.json`.

## Build Project

**`nx build <appname>`**

- Compiles & builds the target Nx Firebase (functions) application to `dist/apps/[dir]/appname`. It will also auto-generate a `package.json` that is compatible with the Firebase CLI for functions deployment.

## Deploy Project (Firebase functions)

**`nx deploy <appname>`**

- Deploys all of your cloud resources (eg. sites, functions, database rules etc.)

For inital deployment:

- **`firebase login`** if not already authenticated
- **`firebase use --add`** to add your Firebase Project(s) to the `.firebaserc` file in your workspace. This step must be completed before you can deploy anything to Firebase.

You can also use the firebase CLI directly:

- **`firebase deploy --only functions --config firebase.<appname>.json`**

## Serve Project

**`nx serve appname`**

- Builds the functions app in watch mode
- Fetches the remote config
- Starts the Firebase emulators

## Get Remote Functions Config

**`nx run getconfig:appname`**

- Fetches the remote server functions configuration variables and saves it locally to the app directory as `.runtimeconfig.json`

See the full plugin [README](https://github.com/simondotm/nx-firebase/blob/main/README.md) for more details.
