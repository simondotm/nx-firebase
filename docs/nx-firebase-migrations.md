# Nx-Firebase Plugin Migrations

Newer versions of the plugin occasionally need to update the workspace configurations, and this page documents the strategies available across these versions.

Please note that these migrations are provided on a 'best effort' basis, due to the fact that workspaces are quite complex and often customised.

- [Nx-Firebase Plugin Migrations](#nx-firebase-plugin-migrations)
  - [Migrating to plugin v2.1 from v2.0](#migrating-to-plugin-v21-from-v20)
  - [Migration to plugin v2.x from v1.x](#migration-to-plugin-v2x-from-v1x)
    - [1. Workspace Migration](#1-workspace-migration)
    - [2. Firebase Project Migration](#2-firebase-project-migration)
    - [3. Firebase Application Migration](#3-firebase-application-migration)
    - [4. Firebase Functions Migration](#4-firebase-functions-migration)
    - [5. Library updates](#5-library-updates)
    - [6. Check Migration](#6-check-migration)




## Migrating to plugin v2.1 from v2.0

Plugin version 2.1 [added some new features](../CHANGELOG.md#v210) that required changes to the project configurations.

To help with this & future updates, an automatic migration generator has been added:

* Update to the latest plugin using `npm i @simondotm/nx-firebase@latest --save-dev`
* Run **npx nx g @simondotm/nx-firebase:migrate**

This tool will run checks on your workspace firebase apps, functions and configurations and try to ensure they are correctly configured for compatibility with the plugin version you are using.

> Please note, this generator is not the same as Nx's own migration tool, so always review the changes it makes to ensure they are appropriate for your workspace.

## Migration to plugin v2.x from v1.x

Version 2.x of this plugin has been completely rewritten, and uses a completely new approach to building & deploying, so migrating an existing Nx workspace using V1 of the plugin to use V2 requires some manual migration procedures.

### 1. Workspace Migration

* First of all, your workspace will need to be migrated to at least Nx 16.1.1.

* Next, update the `@simondotm/nx-firebase` plugin package to the latest v2.x version.

### 2. Firebase Project Migration

Run the following steps 3-5 in order, for each separate Firebase application project in your workspace.

### 3. Firebase Application Migration

* Next, you can either [generate a new firebase v2 application](./nx-firebase-applications.md) project and copy across your Firebase rules, indexes, storage rules etc. to the new firebase application project folder

OR

* you can manually modify your existing Firebase `project.json` to be structured [as shown here](./nx-firebase-project-structure.md#firebase-applications).

### 4. Firebase Functions Migration

If you are using Firebase functions in your project, the migration process is as follows:

* Update the `"functions"` section in the `firebase.json` or `firebase.project-name.json` config file for your firebase application project to be set to `"functions": []`

* Generate a new [Firebase functions application](./nx-firebase-functions.md) in your workspace, using the `--app` parameter set to the name of your Firebase application above

* Move the source code from your old Nx Firebase application `functions/src` folder to the `src` folder in the newly created Firebase function application

* You will need to rename your entry point source file from `index.ts` to `main.ts`
  
* If you migrated your Firebase application in place (as described above), you will need to manually delete the following from your Firebase application folder:
  * `src` folder
  * All `tsconfig.*.json` files
  * `package.json` file

* OR, if you migrated by creating a new firebase application, you can now simply delete the old v1 Firebase application project


Check the [Nx-Firebase project schemas](./nx-firebase-project-structure.md) document for more information about the v2 plugin generators project layouts.

### 5. Library updates

The previous version of the plugin required that all Nx libraries imported by firebase functions were buildable.

With v2 of the plugin, this is no longer the case and Nx libraries can be buildable or non-buildable, since `esbuild` builds from Typescript source files, not compiled JS.

Nx Typescript libraries can be converted to non-buildable by simply removing the `build` target from their `project.json` files.

### 6. Check Migration

Run `nx build your-firebase-project-name` to compile & bundle your functions.

Run `nx deploy your-firebase-project-name` to deploy your project.

