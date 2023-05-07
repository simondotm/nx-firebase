# Firebase Projects

- [Firebase Projects](#firebase-projects)
  - [Introduction](#introduction)
  - [Nx Workspaces With Single Firebase Projects](#nx-workspaces-with-single-firebase-projects)
  - [Nx Workspaces With Multiple Firebase Projects](#nx-workspaces-with-multiple-firebase-projects)
  - [Updating Firebase Configurations](#updating-firebase-configurations)
  - [Binding Nx projects to Firebase projects](#binding-nx-projects-to-firebase-projects)
  - [Renaming Projects](#renaming-projects)
  - [Deployment Environments](#deployment-environments)

## Introduction

Firebase projects are created in the firebase web console, and then specified in your local workspace configurations as deployment targets in your `.firebaserc` file, along with a `firebase.json` configuration for the various cloud components of that project (databases/functions/sites etc.).

`nx-firebase` generally assumes a mapping of one `@simondotm/nx-firebase:app` to one firebase project and configuration file.

## Nx Workspaces With Single Firebase Projects

The first time you run `nx g @simondotm/nx-firebase:app` in an Nx workspace, it will generate a firebase configuration file called `firebase.json` in the workspace root. If you only use a single Firebase project in your Nx workspace, this will be all you need.

The Firebase CLI will use this configuration file by default, and in this scenario there's no need to pass the additional `--config` CLI option.

## Nx Workspaces With Multiple Firebase Projects

This plugin supports multiple Firebase Applications/Projects inside one Nx workspace.

If you run `nx g @simondotm/nx-firebase:app` in an Nx workspace that already has a `firebase.json` configuration file, it will generate a file called `firebase.<appname>.json` configuration in the Nx workspace root which can then be used with any Firebase CLI command by using the `--config <config>` [CLI option](https://firebase.google.com/docs/cli#initialize_a_firebase_project).

## Updating Firebase Configurations

Once your Nx Firebase application has been initially generated you are free to change the firebase configurations however you like. If you don't use Firebase functions, you can choose to either simply ignore or not deploy them, or just remove the `functions` settings from the Firebase configuration for your application.

The Firebase CLI usually warns you anyway if you try to deploy a feature that isn't yet enabled on your Firebase Project console.

## Binding Nx projects to Firebase projects

When using multiple Firebase projects in a workspace, remember that there is only one `.firebaserc` file to contain aliases for all of your deployment targets.

You can add projects using `firebase use --add` as normal.

It's fine to add multiple Firebase projects to your workspace `.firebaserc` file, but remember to correctly switch between them using `firebase use <alias>` before any deployments!

You can ensure this is always the case for commands like `nx deploy app` etc. by adding `--project <alias>` to any firebase commands in your nx-firebase application's targets.

## Renaming Projects

**Important:** _If you do rename your firebase configuration files, remember to update (or remove) any `--config` settings in your Nx-Firebase application's `serve` and `deploy` targets in your `workspace.json` or `angular.json` configuration file._

## Deployment Environments

A common practice with Firebase is to generate different Firebase projects for each deployment environments (such as dev / staging / production etc.)

This can be manually achieved with `nx-firebase` by adding `production` targets to your Nx `project.json` files eg.:

```
    "deploy": {
      "executor": "@nx/workspace:run-commands",
      "options": {
        "command": "npx firebase deploy --config firebase.json --project your-dev-firebase-project"
      },
      "configurations": {
        "production": {
          "command": "npx firebase deploy --config firebase.json --project your-prod-firebase-project"
        }
      }
    },

```

You can now run:

- `nx deploy my-firebase-app` for dev deployment
- `nx deploy my-firebase-app --prod` for production deployment

Note that `your-dev-firebase-project` and `your-prod-firebase-project` must exist as [aliases](https://firebase.google.com/docs/cli#project_aliases) in your `.firebaserc` file for this to work.
