# Nx Firebase Applications

An Nx Firebase application contains the various configurations for Firebase features you might use such as _storage, firestore, and real time database_.

You don't have to use all of these features, but the Nx-Firebase plugin ensures they are all there if/when you do.

Generate a new Firebase application using:

**`nx g @simondotm/nx-firebase:app <app-project-name> [--directory=dir] [--project=proj]`**

When a new Nx Firebase application project is generated in the workspace it will create:

**Within the application folder:**

- Default `firestore.indexes` for Firestore database indexes
- Default `firestore.rules` for Firestore database rules
- Default `database.rules.json` for Firebase realtime database
- Default `storage.rules` for Firebase storage rules
- Default `public/index.html` for Firebase hosting - _you can delete this if your firebase configuration for hosting points elsewhere_.

**And in the workspace root:**

- A `firebase.json` configuration file for the Firebase application
- This is preset with references to the various configuration files in the application folder
- The plugin supports multiple firebase projects in one workspace, so if other firebase applications already exist in the workspace, the firebase configuration file will be named `firebase.<firebase-app-project>.json`

**It will also generate:**

- A default/empty `.firebaserc` in the root of the workspace (if it doesn't already exist)

You should use `npx firebase --add` to register your [projects & aliases](nx-firebase-projects.md) in the `.firebaserc`.

## Nx-Firebase Application Project Targets

These targets will be generated in `project.json` for your new Firebase application:

- `build` - Build all Firebase function applications linked to this Firebase application (if any)
- `serve` - Build all functions in `watch` mode and start the Firebase Emulators
- `deploy` - Run the Firebase CLI `deploy` command with the application's Firebase configuration. This target accepts forwarded command line options.
- `lint` - Lint all Firebase function applications linked to this Firebase application
- `test` - Run Jest unit tests for all Firebase function applications linked to this Firebase application
- `getconfig` - Fetch the firebase remote config

