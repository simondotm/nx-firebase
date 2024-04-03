# Using Firebase Emulators

The Firebase emulators work well within Nx and `nx-firebase`.

To locally develop with the Firebase emulator suite:

- **`nx serve <firebase-app-name>`**

This will launch the Firebase emulators using the app's firebase configuration

It will also build all functions attached to this app in watch mode, so that any changes you make to your function code will be automatically be rebuilt and reloaded by the emulator.

## Nx Issue with Firebase Emulator

Due to a bug in Nx, which does not correctly pass process termination signals to child processes, CTRL+C after `serve` does not shutdown the emulator properly.

For this reason, `serve` uses the `kill-port` npm package to ensure the emulator is properly shutdown before re-running `serve`.

Unfortunately this means the emulator will not properly export data on exit either.

The Nx issue is discussed [here](https://github.com/simondotm/nx-firebase/issues/40).

Hopefully Nx will address this issue in future releases.

## Emulator workaround

Until Nx fix this problem, we are using an experimental executor in the plugin as a interim workaround:

The `serve` target in Firebase app `project.json` configurations is using:

- `@simondotm/nx-firebase:serve`

instead of

- `nx:run-commands`

This custom executor handles CTRL+C in a way that ensures the Firebase Emulator shuts down cleanly.

With this executor you can pass extra CLI parameters for example:

- `nx serve myfirebaseapp --only functions` - only serve functions in the Emulator
