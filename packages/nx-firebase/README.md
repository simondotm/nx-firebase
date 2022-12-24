# @simondotm/nx-firebase

A plugin for [Nx](https://nx.dev) >= 12.1.1 that provides support for Firebase projects in an Nx monorepo workspace.

See [CHANGELOG](https://github.com/simondotm/nx-firebase/blob/main/CHANGELOG.md) for more details.

## Overview

Nx provides a great way to manage monorepo workflows and this plugin helps to integrate Firebase projects with Nx.

This plugin aims to help with this by:

1. Enabling & promoting use of shared Typescript code libraries within Firebase functions
2. Retaining a familiar usage of all Firebase features in a way that feels integrated with Nx workflow
3. Requiring minimal friction/setup for configuration of an Nx workspace in order to be productive with development, building & deployment of Firebase projects
4. Supporting multiple firebase projects within an Nx workspace

# Quick Start

## Installation

**`npm install @simondotm/nx-firebase`**

Installs this plugin into your Nx workspace.

This will also install firebase dependencies (both for backend and frontend) to your root workspace `package.json` if they are not already installed.

## Create Firebase Application

**`nx g @simondotm/nx-firebase:app <appname> [--directory=dir] [--project=proj]`**

Generates a new Nx Firebase application in the workspace - `/apps/[dir]/appname`

The app generator will also create a Firebase configuration file in the root of your workspace (along with a default `.firebaserc` and `firebase.json` if they don't already exist).

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

Or

**`nx deploy project-name --only functions`**

## Serve Project

**`nx serve appname`** - will run `tsc` in watch mode on the app function code and start the Firebase emulators

See the full plugin [README](https://github.com/simondotm/nx-firebase/blob/main/README.md) for more details.

# Nx-Firebase Features

Supports:

- Typescript Firebase functions
- Single or multiple Firebase projects in one Nx workspace
- Firebase applications in app subdirectories
- Use of shared Nx buildable libraries in Firebase functions
- Nx provides automatic dependency checking for builds
- Building functions with `tsc` `--watch` mode
- Firebase Emulators
- Convenience Nx `getconfig` target to fetch remote firebase functions configuration variables to local `.runtimeconfig.json` file
- Convenience Nx `deploy`, `emulate`, and `serve` targets for functions

Additionally:

- Auto generates Firebase functions `package.json` ready for no fuss deployment using the Firebase CLI
- Auto generates default `firebase.json` configurations, rules and indexes for each Firebase app
- Only very lightly opinionated about your Firebase configurations and workspace layouts; you can just use the Firebase CLI as usual
- Keeps all of your firebase rules and indexes within your app folder, to keep your workspace root free of clutter
