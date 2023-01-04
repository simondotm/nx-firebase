# Firebase Functions

- [Firebase Functions](#firebase-functions)
  - [Nx-Firebase Applications Overview](#nx-firebase-applications-overview)
  - [Nx-Firebase Application Files](#nx-firebase-application-files)
  - [Nx-Firebase Application Naming](#nx-firebase-application-naming)
  - [Node Environments / Runtimes for Firebase Functions](#node-environments--runtimes-for-firebase-functions)
  - [Typescript Configurations for Firebase Functions](#typescript-configurations-for-firebase-functions)
  - [ES Modules](#es-modules)

## Nx-Firebase Applications Overview

An Nx-Firebase app is essentially a Firebase _functions_ directory (along with the few other configuration files as mentioned above).

The main difference is that there isn't a directory called `functions` which you may be used to from projects setup by the Firebase CLI; with Nx-Firebase your app directory IS your functions folder.

See the [quickstart guide for functions](quick-start.md#create-firebase-application) for how to generate a functions application.

## Nx-Firebase Application Files

Inside the new `apps/appname` directory you will find the following functions-specific files:

- `package.json` - The stub package file used when deploying firebase functions
- `src` - Your Firebase functions code goes in here. You are free to structure your code however you like in this directory
- `tsconfig.json` and `tsconfig.app.json` as usual

## Nx-Firebase Application Naming

You may find it convenient/familiar to create your Nx-Firebase application simply with `functions` as it's app name eg.:

- `nx g @simondotm/nx-firebase:app functions`.

If you have multiple Firebase projects in your workspace, the Nx-Firebase application generator supports the `--directory` option, so you may also find it convenient to organise your workspace as follows:

- `apps/<projectname>/...<projectapps>`

And generate your app as follows:

- `nx g @simondotm/nx-firebase:app functions --directory projectname`

So your workspace layout might look like this:

```
/apps
    /project1
        /functions
        /web
            /site1-app
            /site2-app
        /mobile
            /app
    /project2
        /functions
        /web
        ...
```

## Node Environments / Runtimes for Firebase Functions

Firebase Functions are deployed by the Firebase CLI to specific Nodejs runtime environments.

The required runtime must be set, and can be specified in two places:

In the `functions/package.json` as a number (eg. `14`, `16`, `18` etc.):

```
  "engines": {
    "node": "16"
  },
```

Or per function, in the `firebase.json` configuration as a definition (eg. `nodejs14`, `nodejs16`, `nodejs18` etc.):

```
  "functions": {
    "runtime": "nodejs16",
    ...
  },
```

The runtimes should ideally be the same for all functions in a project.

## Typescript Configurations for Firebase Functions

Depending on [your selected node runtime](https://stackoverflow.com/questions/59787574/typescript-tsconfig-settings-for-node-js-12/59787575#59787575), your Typescript `tsconfig.json` files for functions applications and libraries should set an appropriate ES version, eg.:

```
{
  "compilerOptions": {
    ...
    "target": "es2021"
  }
}
```

> **Note:** _Firebase functions `tsconfig.app.json` is by default set to target `es2021` which is the maximum ES version for Node 16 runtime engine. This override exists in case the root `tsconfig.base.json` sets an ES target that is incompatible with Firebase Functions Node environment. If you are using a different Node engine, you can change this target manually._

See [here](firebase-versions.md#firebase-node-versions) for more information about firebase node versions.

## ES Modules

See [here](firebase-versions.md#es-modules-support) for more information about firebase support for ES modules with functions.
