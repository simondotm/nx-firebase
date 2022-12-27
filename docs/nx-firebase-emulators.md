# Using Firebase Emulators

The Firebase emulators work well within Nx and `nx-firebase`.

To startup the Firebase emulator suite:

- **`nx emulate appname`** - will launch the Firebase emulators using the app's firebase configuration

When the Firebase Emulators are running, it is no longer possible to run `nx build appname` because the build script always attempts to delete the output directory in `dist` prior to compilation, which conflicts with a resource lock placed on this directory by the emulators.

To workaround this, use:

- **`nx build appname --deleteOutputPath=false`**

which will instruct the build to proceed without cleaning the output directory first. Note this approach could lead to scenarios where spurious files exist in `dist` due to skipping the cleaning step.

The emulators automatically detect changes to configuration files and source files for functions.

To serve the application, use:

- **`nx serve appname`**

Which will build the functions application and all of its dependencies, whilst launching the emulators, and the typescript compiler in watch mode.

> **IMPORTANT:** _Note that whilst `nx serve` will be useful when changing existing functions code, due to `tsc --watch` being enabled, it will NOT correctly detect changes if additional library imports are added to the source code or changes are made to any imported libraries during a watched session. To remedy this, relaunch the emulators by running `nx serve` again._

The latest version of `nx-firebase` uses the `kill-port` npm package to ensure the emulator is properly shutdown before re-running `serve`.
