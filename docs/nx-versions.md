# Nx Versions

Nx versions change rapidly, and are often linked to Angular releases.

The `nx-firebase` plugin does not currently have a migration script, so recommended changes for updating from older Nx versions are as follows:

- Nx versions prior to 13.10.0 used `@nrwl/tao` dependency which doesn't seem to get migrated automatically, so...
- If you are using Nx version < 13.10.x, we would recommend that Nx updates are applied sequentially to ensure safe migrations using this sequence of commands for each update:
  - `npx nx @nx/workspace@<version>`
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
| `12.5.9`   | Same                | recommend running `nx g @nx/workspace:convert-to-nx-project --all` for this version                                                             |
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
| `13.8.8`   | Same                | In this release `@nx/node:package` is replaced with `@nx/js:tsc`                                                                                |
| `13.9.7`   | n/a                 | In this release `@nrwl/tao` is replaced with the `nx` cli, so manual updates of `@nrwl/tao` package version are no longer necessary from hereon |
| `13.10.6`  | n/a                 | The last minor release of Nx 13.                                                                                                                |

## Nx 14

| Nx Version | Notes                                                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| `14.0.0`   | Minor changes to workspace, js configs to ts configs for jest. Angular stays at 13.                                         |
| `14.0.4`   | `root` removed from `project.json`, still at Angular 13                                                                     |
| `14.0.5`   | Broken - forget it. _TypeError: Cannot read properties of undefined (reading 'endsWith')_                                   |
| `14.1.0`   | Fixed again. Repeat of `root` removal migration. Still Angular 13.                                                          |
| `14.1.5`   | Jest config changes                                                                                                         |
| `14.1.8`   | DO NOT TAKE THIS VERSION. MESSED UP NX VERSIONS                                                                             |
| `14.1.11`  |                                                                                                                             |
| `14.2.0`   | Updates Angular 14.0.7. Had to use `--legacy-peer-deps` on npm install. es2020 for angular apps.                            |
|            | Some angular migrations for forms. Also some rootdir issues in this version.                                                |
| `14.2.4`   | Rootdir issues resolved. Had to update ngx-cookie-service and @angular/flex-layout, webapps issue with mediaObserver.media$ |
| `14.3.4`   | Adds `targetDefaults` to `nx.json`                                                                                          |
| `14.4.3`   | `@types/node` updated to `18.0.0`, no other migrations                                                                      |
| `14.5.2`   | Angular updates                                                                                                             |
| `14.5.5`   | Jest config & tsconfig.spec updates                                                                                         |
| `14.5.10`  | Updates `rxjs`, manally updated eslint to fix peerdeps issue, some legacy Angular libs may need updating to be compatible   |
| `14.6.0`   | Updates some angular packages, eslint, jest, installs an rc version of Nx which breaks the nx-firebase plugin on peer deps  |
| `14.7.6`   | @nx/node:webpack => @nrwl/webpack migration                                                                                 |
| `14.8.0`   | Migrates from `@nx/workspace:run-command` to `nx:run-command`                                                               |

## Nx 14.8.0

- Node 16 recommended
- Latest Firebase SDK's work well
- ES Modules / es2020 are available, and latest Firebase SDK's support this

## Nx 15

The plugin is not yet tested with Nx version 15+

See also [Firebase Versions](firebase-versions.md).
