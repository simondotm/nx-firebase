# Nx Versions

Nx versions change rapidly, and are often linked to Angular releases.

The `nx-firebase` plugin does not currently have a migration script, so recommended changes for updating from older Nx versions are as follows:

- Nx versions prior to 13.10.0 used `@nrwl/tao` dependency which doesn't seem to get migrated automatically, so...
- If you are using Nx version < 13.10.x, we would recommend that Nx updates are applied sequentially to ensure safe migrations using this sequence of commands for each update:
  - `npx nx @nrwl/workspace@<version>`
  - `npm install`
  - `npm install @nrwl/tao@<version>`
  - `npx nx migrate --run-migrations`
  - `npx nx run-many --target=build --all` - to check your build continues to work ok with this updated version

Then, run this sequence for each minor release upto Nx 13.10.x, where the list of each minor Nx Update release `version` is:

| Nx Version | `@nrwl/tao` Version | Notes                                                                                                                                           |
| ---------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `12.2.0`   | Same                | (use same `@nrwl/tao` version unless specified otherwise)                                                                                       |
| `12.3.6`   | Same                |                                                                                                                                                 |
| `12.4.0`   | Same                |                                                                                                                                                 |
| `12.5.9`   | Same                | recommend running `nx g @nrwl/workspace:convert-to-nx-project --all` for this version                                                           |
|            |                     | Upgrade node to at least 14.2.0 from this version                                                                                               |
| `12.6.6`   | Same                |                                                                                                                                                 |
| `12.7.2`   | Same                |                                                                                                                                                 |
| `12.8.0`   | Same                |                                                                                                                                                 |
| `12.9.0`   | Same                | and `12.10.0` seem to be problematic, so can skip to:                                                                                           |
| `13.0.0`   | Same                |                                                                                                                                                 |
| `13.0.2`   | Same                | at this point you will need to `npm install @simondotm/nx-firebase@0.3.4`                                                                       |
| `13.1.6`   | `@13.1.4`           |                                                                                                                                                 |
| `13.2.3`   | `@13.2.4`           |                                                                                                                                                 |
| `13.3.12`  | Same                |                                                                                                                                                 |
| `13.4.6`   | Same                |                                                                                                                                                 |
| `13.5.3`   | Same                |                                                                                                                                                 |
| `13.6.1`   | Same                |                                                                                                                                                 |
| `13.7.3`   | Same                |                                                                                                                                                 |
| `13.8.8`   | Same                | In this release `@nrwl/node:package` is replaced with `@nrwl/js:tsc`                                                                            |
| `13.9.7`   | n/a                 | In this release `@nrwl/tao` is replaced with the `nx` cli, so manual updates of `@nrwl/tao` package version are no longer necessary from hereon |
| `13.10.6`  | n/a                 | The last minor release of Nx 13.                                                                                                                |

The plugin is not yet tested with Nx version 14+

See also [Firebase Versions](firebase-versions.md).
