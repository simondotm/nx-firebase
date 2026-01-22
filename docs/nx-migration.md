# Migrating an existing Firebase project to Nx

To bring an existing Firebase project into an Nx workspace, simply [generate the Nx Firebase application(s)](./nx-firebase-applications.md) first, and then just overwrite the generated Firebase configuration & rules/indexes with your existing `firebase.json`, rules & index files etc..

See also [Nx Versions](nx-versions.md) for further information on specific Nx version migrations.

For your Firebase functions, [generate a function application](./nx-firebase-functions.md) and copy your existing source code to this new project `src` directory.

From here, you can simply `nx build` and `nx deploy` your firebase application & functions.

## Firebase SDK versions

Which version of the Firebase CLI + SDK's you use will depend on your particular project requirements, and this plugin is not opinionated to any particular Firebase SDK.

The `nx-firebase` plugin app generator will install Firebase dependencies in the workspace if they are not already present, but it does not require, enforce or change a specific version beyond that initial setup, so you are free to install whichever versions of the firebase SDK packages you need.
