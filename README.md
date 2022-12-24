# @simondotm/nx-firebase

![npm](https://img.shields.io/npm/dw/@simondotm/nx-firebase.svg)

A plugin for [Nx](https://nx.dev) that provides support for Firebase projects in an Nx monorepo workspace.

This project was generated using the Nx plugin workspace generator v12.3.4 but should be compatible with Nx versions > 12.1.1.

See the [CHANGELOG](CHANGELOG.md) for release notes.

## Overview

Nx provides a great way to manage monorepo workflows, however if you have a development setup where your Nx workspace uses one or more Firebase projects that use different combinations and configurations of Firebase features such as _hosting_, _storage_, _database rules/indexes_, and _functions_, then some extra tooling is necessary in order to maintain a familiar Firebase workflow within your monorepo.

This plugin aims to help with this by:

1. Enabling & promoting use of shared Typescript code libraries within Firebase functions
2. Retaining a familiar usage of all Firebase features in a way that feels integrated with Nx workflow
3. Requiring minimal friction/setup for configuration of an Nx workspace in order to be productive with development, building & deployment of Firebase projects

# Quick Start

## Installation

**`npm install @simondotm/nx-firebase`**

Installs this plugin into your Nx workspace.

**`nx g @simondotm/nx-firebase:init`**

Installs firebase dependencies (both for backend and frontend) to your root workspace `package.json` (or you can just `npm install` firebase dependencies manually)

## Create Firebase Application

**`nx g @simondotm/nx-firebase:app <appname> [--directory dir]`**

Generates a new Nx Firebase application in the workspace - `/apps/[dir]/appname`

The app generator will also create a Firebase configuration file called `firebase.appname.json` in the root of your workspace (along with a default `.firebaserc` and `firebase.json` if they don't already exist)

## Build Project

**`nx build appname [--with-deps] [--watch]`**

Compiles & builds the target Nx Firebase (functions) application to `dist/apps/[dir]/appname`. It will also auto-generate a `package.json` that is compatible with the Firebase CLI for functions deployment.

(`nx affected:build [--with-deps]` should also work fine).

> **Notes:**
>
> _Using `--watch` requires at least Nx version 12.3.4 due to [this issue](https://github.com/nrwl/nx/issues/5208)_
>
> _Using `--watch` will not (afaik) detect changes made to dependent libraries_
>
> _If your functions reference any local libraries, always use `--with-deps`_

## Deploy Project (Firebase functions)

For inital deployment:

**`firebase login`** if not already authenticated

**`firebase use --add`** to add your Firebase Project(s) to the `.firebaserc` file in your workspace. This step must be completed before you can deploy anything to Firebase.

Then use either Firebase CLI:

**`firebase deploy --only functions --config firebase.appname.json`**

Or

**`nx deploy appname --only functions`**

> _For deploying websites to Firebase Hosting see the section below_

## Serve Project

**`nx serve appname`** - will build the functions application in `--watch` mode and start the Firebase emulators in parallel

## Get Remote Functions Config

**`nx getconfig appname`** will fetch the remote server functions configuration variables and save them locally to the app directory as `.runtimeconfig.json` for the emulators to use.

# User Guide

**Nx Firebase**

- [Firebase Applications](docs/nx-firebase-applications.md)
- [Firebase Functions](docs/nx-firebase-functions.md)
- [Firebase Hosting](docs/nx-firebase-hosting.md)
- [Firebase Emulators](docs/nx-firebase-emulators.md)
- [Firebase Databases](docs/nx-firebase-databases.md)

**Nx Libraries**

- [Using Nx Libraries with Firebase Functions](docs/nx-libraries.md)
- [Using Nx Libraries within nested sub-directories](docs/nx-libraries-nested.md)

**Nx Workspaces**

- [Migrating an existing Firebase project to Nx](docs/nx-migration.md)
- [Optimizing Nx Libraries for Firebase Functions](docs/optimizing-libraries.md)

**Notes**

- [Technical Notes](docs/technical-notes.md)
- [Supporting Libraries In Functions](docs/supporting-libraries.md)
- [Unsupported Features](docs/unsupported-features.md)
- [Plugin Notes](docs/nx-plugin-commands.md)

> **Note**: I created this plugin to primarily serve my own needs, so feature requests may take a bit of time to consider, but feedback and collaboration is very welcome for this project, since the Nrwl Nx team have an extremely rapid release cadence and it's sometimes hard to keep up with all the changes!
