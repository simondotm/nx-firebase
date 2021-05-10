# @simondotm/nxfirebase

A plugin for [Nx](https://nx.dev) that provides support for Firebase projects in an Nx monorepo workspace.

This project was generated using the Nx plugin workspace generator v12.1.1

> **Note**: This project is an early beta and feedback is very welcome. Please note I created this plugin to primarily serve my own needs, so feature requests may take a bit of time to consider. Also, I don't use the Firebase emulators much so it is probably needing some additional work for supporting that.

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

**`nx run appname:build`**

Compiles & builds the target Nx Firebase (functions) application to `dist/apps/[dir]/appname`. It will also auto-generate a `package.json` that is compatible with the Firebase CLI for functions deployment.

## Deploy Project (Firebase functions)

For inital deployment:

**`firebase login`** if not already authenticated

**`firebase use --add`** to add your Firebase Project(s) to the `.firebaserc` file in your workspace. This step must be completed before you can deploy anything to Firebase.

Then:

**`firebase deploy --only functions --config firebase.appname.json`**

> _For deploying websites to Firebase Hosting see the section below_

# Usage

## Nx Firebase Applications

An Nx Firebase application is primarily a container for _firebase functions_, but it also contains the various configurations for other Firebase features you might use such as _storage, firestore, and real time database_.

You don't have to use all of these features, but the NxFirebase plugin ensures they are all there if/when you do.

When a new Nx Firebase application project is added to the workspace it will generate:

**Within the application folder:**
* A buildable Typescript node library for Firebase functions
* Default `package.json` for the Firebase functions
* Default `firestore.indexes` for Firestore database indexes
* Default `firestore.rules` for Firestore database rules
* Default `database.rules.json` for Firebase realtime database
* Default `storage.rules` for Firebase storage rules

**And in the workspace root:**
* A `firebase.<appname>.json` configuration file for the Firebase project, which is preset with references to the various configuration files in the application folder

**It will also generate:**
* A default/empty `.firebaserc` in the root of the workspace (if it doesn't already exist)
* A default/empty `firebase.json` in the root of the workspace (again, if it doesn't already exist)
> _Note: These two files must exist in the root of a workspace otherwise the Firebase CLI will complain that it needs to initialise itself._

## Updating Configurations

Once your Nx Firebase application has been initially generated you are free to change the firebase configurations however you like. If you don't use Firebase functions, you can choose to either simply ignore or not deploy them, or just remove the `functions` settings from the Firebase configuration for your application.

The Firebase CLI usually warns you anyway if you try to deploy a feature that isn't yet enabled on your Firebase Project console.

## Nx Workspaces With Multiple Firebase Projects
This plugin supports multiple Firebase Applications/Projects inside one Nx workspace. 

Each Nx Firebase Application generates its own `firebase.<appname>.json` configuration which can then be used with any Firebase CLI command by using the `--config <config>` [CLI option](https://firebase.google.com/docs/cli#initialize_a_firebase_project).

> _When using multiple Firebase projects in a workspace, remember that there is only one `.firebaserc` file to contain aliases for all of your deployment targets._
>
> _You can add projects using `firebase use --add` as normal_
>
> _It's fine to add multiple Firebase projects to your workspace `.firebaserc` file, but remember to correctly switch between them using `firebase use <alias>` before any deployments!_

## Nx Workspaces With Single Firebase Projects

If you only use a single Firebase project in your Nx workspace, feel free to delete the auto-generated empty `firebase.json` config and rename the app specific `firebase.appname.json` config to just `firebase.json`.

The Firebase CLI will then just use this default configuration file instead, and in this scenario there's no need to pass the additional `--config` CLI option.

## Firebase Hosting
If you have one or more other web apps (Angular/React/HTML) that are deployed to a hosting site on your Firebase project, simply add them to your workspace as usual using the standard `nx g` app generators.

Then just update your `firebase.appname.json` [hosting configuration](https://firebase.google.com/docs/hosting/full-config) to point to the `dist/apps/<webapp>` where your web app build output is.

You can then run the Firebase CLI as usual to deploy the site:

**`firebase deploy --only hosting --config firebase.appname.json`**

### Static Sites
If you deploy static websites to Firebase Hosting (that do not need to get built by Nx), just create a folder in your `apps` directory (rather than generate an Nx web app) and put your content in that folder. Then update the `hosting` section of your `firebase.appname.json` to simply point directly to this folder.

The firebase CLI hosting deploy command above will just upload the static content as required.

## Rules & Indexes

To keep the root of your Nx workspace tidy, the NxFirebase plugin puts default Firebase rules and index files inside the app folder, and the `firebase.appname.json` configuration file simply points to them there. 

Again, this works just fine with the usual Firebase CLI command, eg:

**`firebase deploy --only firestore:rules`**

This is also useful for cleaner separation if you have multiple Firebase projects in your Nx workspace.

Again, you are free to modify these locations if you wish by simply changing the Firebase configuration files; the NxFirebase plugin does not use these configuration files in any way.

## Migrating an existing Firebase project to Nx

To bring an existing Firebase project into an Nx workspace, simply generate the Nx Firebase application first, and then just overwrite the default configuration & rules/indexes with your existing `firebase.json`, rules & index files.

## Using Nx Libraries with Firebase Functions

NxFirebase supports use of Nx Libraries within functions code.

To use a shared library with an Nx Firebase Application (Functions), first create a buildable (and it must be buildable) Typescript Nx node library in your workspace:

**`nx g @nrwl/node:lib mynodelib --buildable`**

You can now:

`import { stuff } from '@myorg/mynodelib'`

in your Firebase functions code as you'd normally expect.

You can then build your Firebase application (and any dependencies) with:

**`nx run appname:build --with-deps [--force]`**

This action will:
1. Compile any dependent Typescript libraries imported by your Functions Application
2. Compile the Typescript Functions code in your Firebase Application directory
3. Auto generate dependencies in the output `package.json` for your functions
4. Make a local copy of all dependent node libraries referenced by your functions in the Firebase Application `dist/apps/appname/libs` directory and also in the `dist/apps/appname/node_modules` directory
5. Update the Firebase functions `package.json` to use local package references to the dependent libraries.

**TL;DR; version:**

Building the Firebase Application takes care of all local library dependencies so you dont have to, and it ensures your functions are all ready to deploy simply using:

**`firebase deploy --only functions --config firebase.appname.json`**

 _(see Technical Notes below for further explanation of all this)_



# Technical Notes

This plugin builds on a number of interesting conversations in the Nx Github issues regarding use of Firebase within Nx. At the time of writing, there were various workarounds and tooling solutions, which didn't quite hit the spot for me, hence I did some of my own experimentation to see what could be done.

The main feature I wanted was to be able to easily build & deploy Firebase functions in a way that would be familiar (Firebase CLI) but also leverage the power of Nx libraries to share common backend code across multiple Firebase projects.

Firebase is quite particular about how it deploys functions code to GCP, in so much that:
1. It does not upload `node_modules` folder, and 
2. It requires all code used by all functions to be self-contained within the `functions` directory that is set in the `firebase.json` [configuration file](https://firebase.google.com/docs/functions/manage-functions#deploy_functions).

An additional constraint is that we do not want to use Webpack for building function code because:
1. It prevents us from using dynamic function exports that optimize cold starts (since webpack bundles all functions and all exports into one module)
2. With Firebase functions, there's really no need or benefit to optimize, minify or otherwise change the compiled JS we upload

Other considerations:
1. We do care about only deploying functions code that is relevant to the functions being deployed (some workarounds upload all of the workspace)
2. The Firebase CLI is great and familar, so we don't really want to have to add any extra complexity or wrappers around it if we can help it.

## Supporting Libraries in Functions
Supporting libraries as external packages is slightly tricky. The solution the NxFirebase plugin uses is to use [local package references](https://firebase.google.com/docs/functions/handle-dependencies#including_local_nodejs_modules).

NxFirebase has a custom build executor which is based on the `@nrwl/node:package` executor, with a few additional processes.

1. It compiles any node libraries that are dependents of our Firebase application
2. It compiles the Firebase application functions code as a pure buildable Typescript library package
3. It auto-generates npm dependencies in the output `package.json`
4. It makes a copy of all dependent node libraries in `dist/apps/appname/libs/...`
5. It makes another copy of these libraries in `dist/apps/appname/node_modules/...`
6. It transforms any local library package dependencies in the output `package.json` to use local file references to the local `./libs/...` folder eg.

```
"@myorg/mylib": "0.0.1" => "@myorg/mylib": "file:libs/mylib"
```

These steps ensure that the Firebase CLI can deploy functions with all of the correct dependencies and local library fully self contained within the `dist/apps/appname` directory (which pleases the CLI).

The reason why we make an additional copy of dependent libraries to the `node_modules` folder is because the Firebase CLI runs some checks (and partially processes the primary functions entry point node script) prior to deployment to ensure everything is in order. 

The Firebase CLI doesn't upload the `node_modules` folder, only the `./src` and `./libs` folders.

Firebase functions does support [private packages](https://firebase.google.com/docs/functions/handle-dependencies#using_private_modules), but they are frankly a bit of a headache, so packaging libraries locally is a much neater solution, and actually works pretty nicely with Nx workspace workflow.



## Future features
It feels like there could be more utility added to this plugin, but for now I'd thought I'd just share the the early version to see what feedback is like.


# Plugin Development
Notes mainly for my own benefit/reminder here.

## To create the plugin workspace

`npx create-nx-plugin simondotm --pluginName nxfirebase`

## To build the plugin

`nx run nxfirebase:build`

## To test the plugin

`nx run nxfirebase-e2e:e2e`

Creates a temporary workspace in `/tmp/nx-e2e/`

After the e2e test has completed, the plugin can be further manually tested in this temporary workspace.
