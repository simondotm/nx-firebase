# Quick Start

## Installation

**`npm install @simondotm/nx-firebase`**

Installs this plugin into your Nx workspace.

This will also install firebase dependencies (both for backend and frontend) to your root workspace `package.json` if they are not already installed.

## Create Firebase Application

**`nx g @simondotm/nx-firebase:app <appname> [--directory=dir] [--project=proj]`**

Generates a new Nx Firebase application in the workspace - `/apps/[dir]/appname`

The app generator will also create a Firebase configuration file in the root of your workspace (along with a default `.firebaserc` and `firebase.json` if they don't already exist).

Nx will assign your application a project name such as `dir-appname`.

For the first firebase application you create, the project firebase configuration will be `firebase.json`.

If you create additional firebase applications, the project firebase configuration will be `firebase.<project-name>.json`.

## Build Project

**`nx build <project-name>`**

Compiles & builds the target Nx Firebase (functions) application to `dist/apps/[dir]/project-name`. It will also auto-generate a `package.json` that is compatible with the Firebase CLI for functions deployment.

## Deploy Project (Firebase functions)

For inital deployment:

**`firebase login`** if not already authenticated

**`firebase use --add`** to add your Firebase Project(s) to the `.firebaserc` file in your workspace. This step must be completed before you can deploy anything to Firebase.

Then:

**`firebase deploy --only functions --config firebase.<project-name>.json`**

Or:

**`nx deploy project-name --only functions`**

Or you can deploy all of your cloud resources (eg. sites, functions, database rules etc.):

**`nx deploy project-name`**

## Serve Project

**`nx serve appname`** - will run `tsc` in watch mode on the app function code and start the Firebase emulators

See the full plugin [README](https://github.com/simondotm/nx-firebase/blob/main/README.md) for more details.

## Get Remote Functions Config

**`nx getconfig appname`** will fetch the remote server functions configuration variables and save them locally to the app directory as `.runtimeconfig.json` for the emulators to use.
