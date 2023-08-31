# @simondotm/nx-firebase

![npm](https://img.shields.io/npm/dw/@simondotm/nx-firebase.svg)

A plugin for [Nx](https://nx.dev) v16.1.1+ that provides support for Firebase projects in an Nx monorepo workspace.

See [CHANGELOG](https://github.com/simondotm/nx-firebase/blob/main/CHANGELOG.md) for release notes.

This plugin was completely rewritten since V2.x. For documentation of the legacy v1.x plugin version see [here](https://github.com/simondotm/nx-firebase/tree/release/v1.1.0).

## Overview

Nx provides a great way to manage monorepo workflows and this plugin helps make it easy to integrate Firebase projects with Nx.

Features:

* Supports single or multiple firebase projects/apps within an Nx workspace
* Generates Firebase node applications, with default `firebase.json` configurations, rules and indexes for each Firebase app
* Generates Firebase functions using customised Typescript Nx node applications
* Bundling of functions using `esbuild` for extremely fast compilation & tree-shaking for faster cold starts
* Easily import Typescript code libraries in your Firebase functions for code sharing
* Nx's automatic dependency checking for no-fuss builds, and per-project or per-function deployments
* Use the Firebase Emulator suite whilst developing locally - all functions are watched and updated live while you work
* Support for function environment variables and secrets
* Workspace management with the `sync` generator keeps your `firebase.json` configs automatically updated when renaming or deleting functions
* Only very lightly opinionated about your Firebase configurations and workspace layouts; you can use Nx or the Firebase CLI

# User Guide

- **[Quick Start](docs/quick-start.md)**
- [Migrating from plugin v1.x to v2.x](docs/nx-firebase-v2-migration.md)
  
**Nx Firebase Generators**

- [Firebase Applications](docs/nx-firebase-applications.md)
- [Firebase Functions](docs/nx-firebase-functions.md)
- [Firebase Functions - Environment Variables](docs/nx-firebase-functions-environment.md)
- [Firebase Sync](docs/nx-firebase-sync.md)

**Nx Firebase**

- [Firebase Hosting](docs/nx-firebase-hosting.md)
- [Firebase Emulators](docs/nx-firebase-emulators.md)
- [Firebase Databases](docs/nx-firebase-databases.md)
- [Firebase Projects](docs/nx-firebase-projects.md)
- [Project Schemas](docs/nx-firebase-project-structure.md)

**Nx Workspace**

- [Nx Workspace Layout Ideas](docs/nx-workspace-layout.md)
- [Using Nx Libraries with Firebase Functions](docs/nx-libraries.md)
- [Migrating an existing Firebase project to Nx](docs/nx-migration.md)

**Version information**

- [Firebase Versions](docs/firebase-versions.md)
- [Nx Versions](docs/nx-versions.md)

_Note: Some of these may not always be upto date - it's hard work keeping track of external releases and compatibilities!_

**Notes**

- [Plugin Development Notes](docs/nx-plugin-commands.md)
- [Nx Development Setup for Mac](docs/nx-setup-mac.md)
