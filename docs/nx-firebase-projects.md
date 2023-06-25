# Firebase CLI Projects

- [Firebase CLI Projects](#firebase-cli-projects)
  - [Introduction](#introduction)
  - [Nx Workspaces With Single Firebase Projects](#nx-workspaces-with-single-firebase-projects)
  - [Nx Workspaces With Multiple Firebase Projects](#nx-workspaces-with-multiple-firebase-projects)
  - [Updating Firebase Configurations](#updating-firebase-configurations)
  - [Binding Nx projects to Firebase projects](#binding-nx-projects-to-firebase-projects)
  - [Deployment Environments](#deployment-environments)

## Introduction

[Firebase projects](https://firebase.google.com/docs/projects/learn-more) are created in the firebase web console, and then specified in your local workspace configurations as deployment targets in your `.firebaserc` file.

`nx-firebase` assumes a mapping of one `@simondotm/nx-firebase:app` to one firebase project and configuration file.

## Nx Workspaces With Single Firebase Projects

The first time you run `nx g @simondotm/nx-firebase:app` in an Nx workspace, it will generate a firebase configuration file called `firebase.json` in the workspace root. If you only use a single Firebase project in your Nx workspace, this will be all you need.

The Firebase CLI will use this configuration file by default, and in this scenario there's no need to pass the additional `--config` CLI option.

## Nx Workspaces With Multiple Firebase Projects

This plugin supports multiple Firebase Applications/Projects inside one Nx workspace.

If you run `nx g @simondotm/nx-firebase:app` in an Nx workspace that already has a `firebase.json` configuration file, it will generate a file called `firebase.<appname>.json` configuration in the Nx workspace root which can then be used with any Firebase CLI command by using the `--config <config>` [CLI option](https://firebase.google.com/docs/cli#initialize_a_firebase_project).

## Updating Firebase Configurations

Once your Nx Firebase application has been initially generated you are free to change the firebase configurations however you like. 

The Firebase CLI usually warns you anyway if you try to deploy a feature that isn't yet enabled on your Firebase Project console.

## Binding Nx projects to Firebase projects

When using multiple Firebase projects in a workspace, remember that there is only one `.firebaserc` file to contain aliases for all of your deployment targets.

You can add projects using `firebase use --add` as normal.

It's fine to add multiple Firebase projects to your workspace `.firebaserc` file, but it is important to remember to correctly switch between them using `firebase use <alias>` before any deployments!

You can ensure this is always the case for commands like `nx deploy app` etc. by adding `--project <alias>` to any firebase commands in your nx-firebase application's targets.

See also: [Changing Firebase CLI Project](./nx-firebase-sync.md#changing-firebase-cli-project)


## Deployment Environments

A common practice with Firebase is to generate different Firebase projects for each deployment environments (such as dev / staging / production etc.)

This can be manually achieved with `nx-firebase` by adding `production` configurations to the `firebase` target in your Nx firebase application `project.json` file eg.:

```
    firebase: {
      executor: 'nx:run-commands',
      options: {
        command: `firebase --config firebase.json --project your-dev-firebase-project`,
      },
      configurations: {
        production: {
          command: `firebase --config firebase.json --project your-prod-firebase-project`,
        },
      },
    },
```

You can now run:

- `nx deploy my-firebase-app` for dev deployment
- `nx deploy my-firebase-app --prod` for production deployment

Note that `your-dev-firebase-project` and `your-prod-firebase-project` must exist as [aliases](https://firebase.google.com/docs/cli#project_aliases) in your `.firebaserc` file for this to work.
