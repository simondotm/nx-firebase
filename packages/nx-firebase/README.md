# @simondotm/nx-firebase

A plugin for [Nx](https://nx.dev) v16.1.1+ that provides support for Firebase projects in an Nx monorepo workspace.

See [CHANGELOG](https://github.com/simondotm/nx-firebase/blob/main/CHANGELOG.md) for release notes.

This plugin was completely rewritten since V2.x to use esbuild for bundling cloud functions. For documentation of the legacy v1.x plugin version see [here](https://github.com/simondotm/nx-firebase/tree/release/v1.1.0).

## Overview

Nx provides a great way to manage monorepo workflows and this plugin helps make it easy to integrate Firebase projects with Nx.

Features:

* Supports single or multiple firebase projects/apps within an Nx workspace
* Generates Firebase application projects, with default `firebase.json` configurations, rules and indexes for each Firebase app
* Generates Firebase functions using customised Typescript Nx node applications
* Bundling of functions using `esbuild` for extremely fast compilation & tree-shaking for faster cold starts
* Easily import Typescript code libraries in your Firebase functions for code sharing
* Supports function environment variables and secrets
* Nx's automatic dependency checking for no-fuss builds, and per-project or per-function deployments
* Use the Firebase Emulator suite whilst developing locally - all functions are watched and updated live while you work
* Workspace management with the `sync` generator keeps your `firebase.json` configs automatically updated when renaming or deleting functions
* Only very lightly opinionated about your Firebase configurations and workspace layouts; you can use Nx or the Firebase CLI

## Further Information

See the full plugin [README](https://github.com/simondotm/nx-firebase/blob/main/README.md) for more details.
