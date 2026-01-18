# @simondotm/nx-firebase ![actions](https://github.com/simondotm/nx-firebase/actions/workflows/ci.yml/badge.svg) ![npm](https://img.shields.io/npm/v/@simondotm/nx-firebase) ![downloads](https://img.shields.io/npm/dw/@simondotm/nx-firebase.svg)

A plugin for [Nx](https://nx.dev) that integrates Firebase workflows in an Nx monorepo workspace.

* Easily generate Firebase applications and functions
* Uses `esbuild` for fast Firebase function builds so you can easily create & import shared Nx libraries with the benefits of tree-shaking
* Supports function environment variables and secrets
* Supports single or multiple firebase projects/apps within an Nx workspace
* Full support for the Firebase Emulator suite for local development, with watch mode for functions
* Keeps your `firebase.json` configurations in sync when renaming or deleting Firebase apps & functions
* Only very lightly opinionated about your Firebase configurations and workspace layouts; you can use Nx or the Firebase CLI

See [CHANGELOG](https://github.com/simondotm/nx-firebase/blob/main/CHANGELOG.md) for release notes.

## Install Plugin

**`npm install @simondotm/nx-firebase --save-dev`**

- Installs this plugin into your Nx workspace
- This will also install `@nx/node` and firebase SDK's to your root workspace `package.json` if they are not already installed

## Generate Firebase Application

**`nx g @simondotm/nx-firebase:app my-new-firebase-app [--directory=dir] [--project=proj]`**

- Generates a new Nx Firebase application project in the workspace
- The app generator will also create a Firebase configuration file in the root of your workspace (along with a default `.firebaserc` and `firebase.json` if they don't already exist)
- For the first firebase application you create, the project firebase configuration will be `firebase.json`
- If you create additional firebase applications, the project firebase configuration will be `firebase.<app-project-name>.json`
- Use `--project` to link your Firebase App to a Firebase project name in your `.firebaserc` file

## Generate Firebase Function

**`nx g @simondotm/nx-firebase:function my-new-firebase-function --app=my-new-firebase-app [--directory=dir]`**

- Generates a new Nx Firebase function application project in the workspace
- Firebase Function projects must be linked to a Firebase application project with the `--app` option
- Firebase Function projects can contain one or more firebase functions
- You can generate as many Firebase Function projects as you need for your application

## Build 

**`nx build my-new-firebase-app`**

- Compiles & builds all Firebase function applications linked to the Nx Firebase application or an individual function

**`nx build my-new-firebase-function`**

- Compiles & builds an individual function


## Serve

**`nx serve my-new-firebase-app`**

- Builds & Watches all Firebase functions apps linked to the Firebase application
- Starts the Firebase emulators

## Deploy

### Firebase Application

**`nx deploy my-new-firebase-app [--only ...]`**

- By default, deploys ALL of your cloud resources associated with your Firebase application (eg. sites, functions, database rules etc.)
- Use the `--only` option to selectively deploy (same as Firebase CLI)

For initial deployment:

- **`firebase login`** if not already authenticated
- **`firebase use --add`** to add your Firebase Project(s) to the `.firebaserc` file in your workspace. This step must be completed before you can deploy anything to Firebase.

Note that you can also use the firebase CLI directly if you prefer:

- **`firebase deploy --config=firebase.<appname>.json --only functions`**

### Firebase Function

**`nx deploy my-new-firebase-function`**

- Deploys only a specific Firebase function



## Test

**`nx test my-new-firebase-app`**

- Runs unit tests for all Firebase functions apps linked to the Firebase application

**`nx test my-new-firebase-function`**

- Runs unit tests for an individual function


## Lint

**`nx lint my-new-firebase-app`**

- Runs linter for all Firebase functions apps linked to the Firebase application or an individual function

**`nx lint my-new-firebase-function`**

- Runs linter for an individual function

## Sync Workspace

**`nx g @simondotm/nx-firebase:sync`**

- Ensures that your `firebase.json` configurations are kept up to date with your workspace
  - If you rename or move firebase application or firebase function projects
  - If you delete firebase function projects

## Further Information

See the full plugin [User Guide](https://github.com/simondotm/nx-firebase/blob/main/docs/user-guide.md) for more details.