# Using Nx Libraries with Firebase Functions

Nx-Firebase supports use of Nx Libraries within functions code.

## Creating a library

To use a shared library with an Nx Firebase Function Application, simply create a Typescript Nx node library in your workspace:

**`nx g @nx/js:lib mylib --importPath="@myorg/mylib [--bundler=<bundler>]`**

> _Note: The `--importPath` option is highly recommended to ensure the correct typescript aliases and npm package configurations for your library._


## Importing a library

You can now:

`import { stuff } from '@myorg/mynodelib'`

in your Firebase functions code as you'd normally expect.

## Building with libraries

You can then build your Firebase application or function with:

**`nx build <firebase-app-name>`**

OR

**`nx build <firebase-function-name>`**

## Nx Library Notes

[Firebase functions](./nx-firebase-functions.md) use `esbuild` to bundle function code, we gain a few benefits:

- Nx takes care of ensuring all necessary dependencies will be also built.
- It does not matter if libraries are buildable or non-buildable, as `esbuild` builds from Typescript sources, however buildable libraries may be preferred since `esbuild` does not do type checking of imported libraries.
- We do not have to worry about how we structure libraries anymore for optimal function runtime.
- For instance, we can use barrel imports freely, since `esbuild` will treeshake unused code and inline imports into the bundled output `main.js`
- We can create as many libraries as we wish for our functions to use, and organise them in whatever makes most sense for the workspace
- For cleaner code sharing, Firebase function applications can simply import a library module containing the firebase function export/implementation
