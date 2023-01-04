# Nx Firebase Applications

An Nx Firebase application is primarily a container for _firebase functions_, but it also contains the various configurations for other Firebase features you might use such as _storage, firestore, and real time database_.

You don't have to use all of these features, but the Nx-Firebase plugin ensures they are all there if/when you do.

When a new Nx Firebase application project is added to the workspace it will generate:

**Within the application folder:**

- Default `src` Typescript source code for Firebase functions
- Default `package.json` for the Firebase functions
- Default `firestore.indexes` for Firestore database indexes
- Default `firestore.rules` for Firestore database rules
- Default `database.rules.json` for Firebase realtime database
- Default `storage.rules` for Firebase storage rules
- Default `public/index.html` for Firebase hosting - _you can delete this if your firebase configuration for hosting points elsewhere_.

**And in the workspace root:**

- A `firebase.json` (or `firebase.<appname>.json` if multiple firebase apps in the workspace) configuration file for the Firebase project, which is preset with references to the various configuration files in the application folder

**It will also generate:**

- A default/empty `.firebaserc` in the root of the workspace (if it doesn't already exist)

You should use `npx firebase --add` to register your [projects & aliases](nx-firebase-projects.md) in the `.firebaserc`.

## Nx-Firebase Application Targets (Executors)

- `build` - Build the functions applicaion
- `serve` - Build the functions application in `--watch` mode and start the Firebase Emulators
- `deploy` - Run the Firebase CLI `deploy` command with the application's Firebase configuration. This target accepts forwarded command line options.
- `lint` - Lint the functions application code
- `test` - Run Jest unit tests on the functions application code
