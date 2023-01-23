# Plugin Versions

- Plugin versions will be matched to Nx versions - eg. 13.10.6
- There will be a release/v13.10.6 branch for each release that will allow patching if necessary

- `release/v13.10.6` -> Compatible with Nx 13.10.6

Unit testing

Can we create a bunch of skeleton workspaces that we run tests on?

eg.

- `/compat`
  - `/13.10.6`
  - `/14.0.0`

Each of these is a blank workspace. We can gitignore everything.

Maybe we just create the workspaces in a script. What do we need?

1. `npm ci` the workspace
2. Build the plugin
3. `npx create-nx-workspace@13.10.6 --preset=apps`
4. Add a local ref to the plugin
5. Generate a firebase app - check it builds
6. Generate a lib - check it builds
7. Add the lib as an import - check it builds
8. Modify the firebaserc with our secret firebase project
9. Check it deploys

Do this for each node version we want - 14, 16, 18
Do this for each Nx version we want - 13
We can check that old plugin versions work with newer Nx:

- Plugin v13 check against Nx 13,14,15, for Node 14,16,18
- Plugin v14 check against Nx 14,15, for Node 14,16,18
- Plugin v15 check against Nx 15, for Node 14,16,18
