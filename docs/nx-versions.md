# Nx Versions

Nx versions change rapidly, and are often linked to Angular releases.

The `nx-firebase` plugin does not currently have a migration script, so recommended changes for updating from older Nx versions are as follows:

- From Nx version 12.5.9+,
- Upgrade Node version to at least 14.2.0
- Nx versions prior to 13.10.0 used `@nrwl/tao` dependency which doesn't seem to get migrated automatically, so...
- If you are using Nx version < 13.10.x, we would recommend that Nx updates are applied sequentially to ensure safe migrations using this sequence of commands for each update:
  - `npx nx @nrwl/workspace@<version>`
  - `npm install`
  - `npm install @nrwl/tao@<version>`
  - `npx nx migrate --run-migrations`
  - `npx nx run-many --target=build --all` - to check your build continues to work ok with this updated version

Then, run this sequence for each minor release upto Nx 13.10.x, where the list of each minor Nx Update release `version` is:

- `12.2.0` (use same `@nrwl/tao` version unless specified otherwise)
- `12.3.6`
- `12.4.0`,
- `12.5.9` - recommend running `nx g @nrwl/workspace:convert-to-nx-project --all` for this version
- `12.6.6`
- `12.7.2`
- `12.8.0`
- `12.9.0` and `12.10.0` seem to be problematic, so can skip to:
- `13.0.0`
- `13.0.2` - at this point you will need to `npm install @simondotm/nx-firebase@0.3.4`
- `13.1.6` (use tao version `@13.1.4`)
- `13.2.3` (use tao version `@13.2.4`)
- `13.3.12`
- `13.4.6`
- `13.5.3`
- `13.6.1`
- `13.7.3`
- `13.8.8` - In this release `@nrwl/node:package` is replaced with `@nrwl/js:tsc`
- `13.9.7` - In this release `@nrwl/tao` is replaced with the `nx` cli, so manual updates of `@nrwl/tao` package version are no longer necessary from hereon
- `13.10.6` - The last minor release of Nx 13.

The plugin is not yet tested with Nx version 14+
