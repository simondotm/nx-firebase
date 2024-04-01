# @simondotm/nx-firebase

A plugin for [Nx](https://nx.dev) v16.8.1+ that provides support for Firebase projects in an Nx monorepo workspace.

See [CHANGELOG](https://github.com/simondotm/nx-firebase/blob/main/CHANGELOG.md) for release notes.

## Overview

Nx provides a great way to manage monorepo workflows and this plugin helps make it easy to integrate Firebase projects with Nx.

### Features

* **Firebase Apps**
  * Generates Firebase application projects, with default `firebase.json` configurations, rules and indexes for each Firebase app
* **Firebase Functions**
  * Generates Firebase function apps based on Typescript Nx node applications
  * Bundling of Firebase functions using `esbuild` for extremely fast compilation & tree-shaking for optimal function cold starts
  * Easily import Typescript Nx libraries from your Nx workspace into your Firebase functions for code sharing across projects
  * Supports function environment variables and secrets
* **Firebase Features**
  * Use the Firebase Emulator suite whilst developing locally - all functions are watched and updated live while you work
  * Use Firebase hosting with Nx to easily build & deploy web apps
* **Workspace Management**
  * Nx's automatic dependency checking for no-fuss builds, and per-project or per-function deployments
  * Supports single or multiple firebase projects/apps within an Nx workspace
  * Nx workspace management with the `sync` generator keeps your project & `firebase.json` configs automatically updated when renaming or deleting Firebase apps & functions
  * Only very lightly opinionated about your Firebase configurations and workspace layouts; you can use Nx or the Firebase CLI

## Further Information

See the full plugin [README](https://github.com/simondotm/nx-firebase/blob/main/README.md) for more details.
