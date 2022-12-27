# Migrating an existing Firebase project to Nx

To bring an existing Firebase project into an Nx workspace, simply generate the Nx Firebase application(s) first, and then just overwrite the generated Firebase configuration & rules/indexes with your existing `firebase.json`, rules & index files.

See also [Nx Versions](nx-versions.md) for further information on specific Nx version migrations.

## Firebase SDK versions

Which version of the Firebase CLI + SDK's you use will depend on your particular project requirements, and you may need to experiment to find specific compatible versions:

- If you are using Angular/AngularFire libraries, depending on your version of Angular
- If you are using Node 16/Node 18 runtimes
- If you are using ES modules rather than commonjs.
- Use of at least Node 16 functions runtime is now recommended over Node 10 and 12 as of December 2022

The `nx-firebase` plugin will install Firebase dependencies in the workspace if they are not already present, but it does not require, enforce or change a specific version beyond that initial setup, so you are free to `npm install` whichever versions of the firebase SDK packages you need.
