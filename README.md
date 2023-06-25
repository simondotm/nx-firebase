# @simondotm/nx-firebase

![npm](https://img.shields.io/npm/dw/@simondotm/nx-firebase.svg)

A plugin for [Nx](https://nx.dev) v16.1.1+ that provides support for Firebase projects in an Nx monorepo workspace.

See [CHANGELOG](https://github.com/simondotm/nx-firebase/blob/main/CHANGELOG.md) for release notes.

This plugin was completely rewritten since V2.x. For documentation of the legacy v1.x plugin version see [here](https://github.com/simondotm/nx-firebase/tree/release/v1.1.0).

## Overview

Nx provides a great way to manage monorepo workflows and this plugin helps to integrate Firebase projects with Nx, by:

1. Enabling & promoting use of shared Typescript code libraries within Firebase functions
2. Retaining a familiar usage of all Firebase features in a way that feels integrated with Nx workflow
3. Requiring minimal friction/setup for configuration of an Nx workspace in order to be productive with development, building & deployment of Firebase projects
4. Supporting multiple firebase projects & apps within an Nx workspace

## Nx-Firebase Features

Supports:

- Single or multiple Firebase projects in one Nx workspace
- Firebase functions as Typescript Nx applications, now bundled using esbuild
- Use of shared Nx libraries in Firebase functions
- Nx provides automatic dependency checking for builds
- Building & serving functions with watch mode & Firebase Emulators
- Convenience Nx `getconfig` target to fetch remote firebase functions configuration variables to local `.runtimeconfig.json` file
- Convenience Nx `deploy` , and `serve` targets for functions

Additionally:

- Auto bundles & generates Firebase functions `package.json` ready for no fuss deployment using the Firebase CLI
- Auto generates default `firebase.json` configurations, rules and indexes for each Firebase app
- Only very lightly opinionated about your Firebase configurations and workspace layouts; you can just use the Firebase CLI as usual
- Keeps all of your firebase rules and indexes within your app folder, to keep your workspace root free of clutter

# User Guide

- **[Quick Start](docs/quick-start.md)**

**Nx Firebase**

- [Firebase Applications](docs/nx-firebase-applications.md)
- [Firebase Functions](docs/nx-firebase-functions.md)
- [Firebase Sync](docs/nx-firebase-sync.md)
- [Firebase Hosting](docs/nx-firebase-hosting.md)
- [Firebase Emulators](docs/nx-firebase-emulators.md)
- [Firebase Databases](docs/nx-firebase-databases.md)
- [Firebase Projects](docs/nx-firebase-projects.md)
- [Firebase Versions](docs/firebase-versions.md)

**Nx Workspace**

- [Using Nx Libraries with Firebase Functions](docs/nx-libraries.md)
- [Migrating an existing Firebase project to Nx](docs/nx-migration.md)
- [Nx Versions](docs/nx-versions.md)

**Notes**

- [Plugin Development Notes](docs/nx-plugin-commands.md)
- [Nx Development Setup for Mac](docs/nx-setup-mac.md)
