# @simondotm/nxfirebase

A plugin for [Nx](https://nx.dev) that provides support for Firebase projects in an Nx monorepo workspace.


## Overview

Nx provides a great way to manage monorepo workflows, however if you have a development setup where your Nx workspace uses one or more Firebase projects that use different combinations and configurations of Firebase features such as _hosting_, _storage_, _database rules/indexes_, and _functions_, then some extra tooling is necessary in order to maintain a familiar Firebase workflow within your monorepo.

This plugin aims to help with this by:
1. Enabling & promoting use of shared Typescript code libraries within Firebase functions
2. Retaining a familiar usage of all Firebase features in a way that feels integrated with Nx workflow
3. Requiring minimal friction/setup for configuration of an Nx workspace in order to be productive with development, building & deployment of Firebase projects

# Quick Start

## Installation
**`npm install @simondotm/nxfirebase`**

Installs this plugin into your Nx workspace.


**`nx g @simondotm/nxfirebase:init`**

Installs firebase dependencies (both for backend and frontend) to your root workspace `package.json` (or you can just `npm install` firebase dependencies manually)

## Create Firebase Application

**`nx g @simondotm/nxfirebase:app <appname> [--directory dir]`**

Generates a new Nx Firebase application in the workspace - `/apps/[dir]/appname`

The app generator will also create a Firebase configuration file called `firebase.appname.json` in the root of your workspace (along with a default `.firebaserc` and `firebase.json` if they don't already exist)

## Build Project

**`nx build appname [--with-deps]`**

Compiles & builds the target Nx Firebase (functions) application to `dist/apps/[dir]/appname`. It will also auto-generate a `package.json` that is compatible with the Firebase CLI for functions deployment.

## Deploy Project (Firebase functions)

For inital deployment:

**`firebase login`** if not already authenticated

**`firebase use --add`** to add your Firebase Project(s) to the `.firebaserc` file in your workspace. This step must be completed before you can deploy anything to Firebase.

Then:

**`firebase deploy --only functions --config firebase.appname.json`**

# NxFirebase Features

* Supports Typescript Firebase functions
* Supports single or multiple Firebase projects in one Nx workspace
* Enables Firebase functions to easily import from buildable node libraries in the Nx workspace
* Supports Nx dependency checking for builds
* Auto generates Firebase functions `package.json` ready for no fuss deployment using the Firebase CLI
* Auto generates default `firebase.json` configurations, rules and indexes for each Firebase app
* Only very lightly opinionated about your Firebase configurations and layouts; you can just use the Firebase CLI as usual
* Keeps all of your firebase rules and indexes within your app folder, to keep your workspace root free of clutter