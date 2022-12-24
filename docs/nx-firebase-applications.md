## Nx Firebase Applications

An Nx Firebase application is primarily a container for _firebase functions_, but it also contains the various configurations for other Firebase features you might use such as _storage, firestore, and real time database_.

You don't have to use all of these features, but the Nx-Firebase plugin ensures they are all there if/when you do.

When a new Nx Firebase application project is added to the workspace it will generate:

**Within the application folder:**

- A buildable Typescript node library for Firebase functions
- Default `package.json` for the Firebase functions
- Default `firestore.indexes` for Firestore database indexes
- Default `firestore.rules` for Firestore database rules
- Default `database.rules.json` for Firebase realtime database
- Default `storage.rules` for Firebase storage rules
- Default `public/index.html` for Firebase hosting - _you can delete this if your firebase configuration for hosting points elsewhere_.

**And in the workspace root:**

- A `firebase.<appname>.json` configuration file for the Firebase project, which is preset with references to the various configuration files in the application folder

**It will also generate:**

- A default/empty `.firebaserc` in the root of the workspace (if it doesn't already exist)
- A default/empty/stub `firebase.json` in the root of the workspace (again, if it doesn't already exist)
  > _Note: These two files must exist in the root of a workspace otherwise the Firebase CLI will complain that it needs to initialise itself._
  >
  > _**Important:** The default `firebase.json` is intentionally empty, because the idea is to use `firebase.appname.json` instead. (Although I'm reviewing this atm as it seems slightly unintuitive for [single firebase project workspaces](#nx-workspaces-with-single-firebase-projects)!)_

## Nx-Firebase Application Targets (Executors)

- `build` - Build the functions applicaion
- `serve` - Build the functions application in `--watch` mode and start the Firebase Emulators
- `deploy` - Run the Firebase CLI `deploy` command with the application's Firebase configuration. This target accepts forwarded command line options.
- `lint` - Lint the functions application code
- `test` - Run Jest unit tests on the functions application code

## Updating Configurations

Once your Nx Firebase application has been initially generated you are free to change the firebase configurations however you like. If you don't use Firebase functions, you can choose to either simply ignore or not deploy them, or just remove the `functions` settings from the Firebase configuration for your application.

The Firebase CLI usually warns you anyway if you try to deploy a feature that isn't yet enabled on your Firebase Project console.

## Nx Workspaces With Multiple Firebase Projects

This plugin supports multiple Firebase Applications/Projects inside one Nx workspace.

Each Nx Firebase Application generates its own `firebase.<appname>.json` configuration in the Nx workspace root which can then be used with any Firebase CLI command by using the `--config <config>` [CLI option](https://firebase.google.com/docs/cli#initialize_a_firebase_project).

> _When using multiple Firebase projects in a workspace, remember that there is only one `.firebaserc` file to contain aliases for all of your deployment targets._
>
> _You can add projects using `firebase use --add` as normal_
>
> _It's fine to add multiple Firebase projects to your workspace `.firebaserc` file, but remember to correctly switch between them using `firebase use <alias>` before any deployments!_

## Nx Workspaces With Single Firebase Projects

If you only use a single Firebase project in your Nx workspace, feel free to delete the auto-generated empty `firebase.json` config and rename the app specific `firebase.appname.json` config to just `firebase.json`.

The Firebase CLI will then just use this default configuration file instead, and in this scenario there's no need to pass the additional `--config` CLI option.

> **Important:** _If you do rename your firebase configuration files, remember to update (or remove) any `--config` settings in your Nx-Firebase application's `serve` and `deploy` targets in your `workspace.json` or `angular.json` configuration file._
