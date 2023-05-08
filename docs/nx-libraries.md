# Using Nx Libraries with Firebase Functions

Nx-Firebase supports use of Nx Libraries within functions code.

## Creating a library

To use a shared library with an Nx Firebase Application (Functions), first create a buildable (and it must be buildable) Typescript Nx node library in your workspace:

**`nx g @nx/node:lib mynodelib --buildable --importPath="@myorg/mynodelib`**

> _Note: The `--importPath` option is highly recommended to ensure the correct typescript aliases and npm package configurations for your library._

As of Nx 13.8.8, you can also use:

**`nx g @nx/js:tsc mylib --buildable --importPath="@myorg/mylib`**

## Importing a library

You can now:

`import { stuff } from '@myorg/mynodelib'`

in your Firebase functions code as you'd normally expect.

## Building with libraries

You can then build your Firebase application (and any dependencies) with:

**`nx build appname`**

This action will:

1. Compile any dependent Typescript libraries imported by your Functions Application
2. Compile the Typescript Functions code in your Firebase Application directory
3. Auto generate dependencies in the output `package.json` for your functions
4. Make a local copy of all dependent node libraries referenced by your functions in the Firebase Application `dist/apps/appname/libs` directory and also in the `dist/apps/appname/node_modules` directory
5. Update the Firebase functions `package.json` to use local package references to the dependent libraries.

> _**Note:** The Nx-Firebase plugin will detect if any non-buildable libraries have been imported by a firebase application, and halt compilation._

## Deploying with libraries

Building the Firebase Application takes care of all local library dependencies so you dont have to, and it ensures your functions are all ready to deploy simply using:

**`firebase deploy --only functions --config firebase.appname.json`**

Or

**`nx deploy appname --only functions`**

_(see [Technical Notes](technical-notes.md) for further explanation of all this)_
