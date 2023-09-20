# Quick Start

- [Quick Start](#quick-start)
  - [Install Plugin](#install-plugin)
  - [Generate Firebase Application Project](#generate-firebase-application-project)
  - [Generate Firebase Function Application Project](#generate-firebase-function-application-project)
  - [Build Firebase Application](#build-firebase-application)
  - [Deploy Firebase Application](#deploy-firebase-application)
  - [Serve Firebase Project](#serve-firebase-project)

## Install Plugin

**`npm install @simondotm/nx-firebase --save-dev`**

- Installs this plugin into your Nx workspace.
- This will also install some Nx and firebase dependencies (both for backend and frontend) to your root workspace `package.json` if they are not already installed.
- The plugin is compatible with Nx versions 16.1.1 or above

## Generate Firebase Application Project

**`nx g @simondotm/nx-firebase:app <app-project-name> [--directory=dir] [--project=proj]`**

- Generates a new Nx Firebase application project in the workspace
- The app generator will also create a Firebase configuration file in the root of your workspace (along with a default `.firebaserc` and `firebase.json` if they don't already exist).
- For the first firebase application you create, the project firebase configuration will be `firebase.json`.
- If you create additional firebase applications, the project firebase configuration will be `firebase.<app-project-name>.json`.

## Generate Firebase Function Application Project

**`nx g @simondotm/nx-firebase:function <function-project-name> --app=<app-project-name> [--directory=dir]`**

- Generates a new Nx Firebase function application project in the workspace
- Firebase Function projects must be linked to a Firebase application project with the `--app` option
- Firebase Function projects can contain one or more firebase functions
- You can generate as many Firebase Function projects as you need for your application


## Build Firebase Application

**`nx build <app-project-name>`**

- Compiles & builds all Firebase function applications linked to the Nx Firebase 

## Deploy Firebase Application 

**`nx deploy <app-project-name> [--only ...]`**

- By default, deploys ALL of your cloud resources associated with your Firebase application (eg. sites, functions, database rules etc.)
- Use the `--only` option to selectively deploy (same as Firebase CLI)

For inital deployment:

- **`firebase login`** if not already authenticated
- **`firebase use --add`** to add your Firebase Project(s) to the `.firebaserc` file in your workspace. This step must be completed before you can deploy anything to Firebase.

Note that you can also use the firebase CLI directly if you prefer:

- **`firebase deploy --config=firebase.<appname>.json --only functions`**

## Serve Firebase Project

**`nx serve <app-project-name>`**

- Builds & Watches all Firebase functions apps linked to the Firebase application
- Starts the Firebase emulators
