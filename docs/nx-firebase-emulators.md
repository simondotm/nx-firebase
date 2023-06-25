# Using Firebase Emulators

The Firebase emulators work well within Nx and `nx-firebase`.

To locally develop with the Firebase emulator suite:

- **`nx serve <firebase-app-name>`**

This will launch the Firebase emulators using the app's firebase configuration

It will also build all functions attached to this app in watch mode, so that any changes you make to your function code will be automatically be rebuilt and reloaded by the emulator.


Due to a bug in Nx, which does not correctly pass process termination signals to child processes, CTRL+C after `serve` does not shutdown the emulator properly.

For this reason, `serve` uses the `kill-port` npm package to ensure the emulator is properly shutdown before re-running `serve`.

Unfortunately this means the emulator will not properly export data on exit either. This can be worked around using an `npm` script as described [here](https://github.com/simondotm/nx-firebase/issues/40).

Hopefully Nx will address this issue in future releases.

