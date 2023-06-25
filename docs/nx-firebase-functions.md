# Firebase Functions

- [Firebase Functions](#firebase-functions)
  - [Nx-Firebase Functions](#nx-firebase-functions)
  - [Functions \& Nx-Firebase Applications](#functions--nx-firebase-applications)
  - [Functions \& Firebase Config](#functions--firebase-config)
  - [Functions \& ESBuild](#functions--esbuild)
    - [Using ES Modules output](#using-es-modules-output)
    - [Using CommonJS output](#using-commonjs-output)
    - [Why ESBuild?](#why-esbuild)
  - [Nx-Firebase Workspace Layout](#nx-firebase-workspace-layout)
  - [Node Environments / Runtimes for Firebase Functions](#node-environments--runtimes-for-firebase-functions)

## Nx-Firebase Functions

Since v2.x of the plugin, Nx-Firebase functions are now generated as individual applications, separately to the Nx-Firebase application.

Generate a new Firebase function using:

**`nx g @simondotm/nx-firebase:function <function-project-name> --app=<app-project-name> [--directory=dir] [--format=<'cjs'|'esm'>]`**

Firebase function application projects are buildable node Typescript applications, which are compiled and bundled using `esbuild`.

The entry point module is `src/main.ts`.

`esbuild` will compile & bundle the input function Typescript source code to:

* `dist/apps/<function-project-name>/main.js` - The bundled function code, in a single ESM format output file
* `dist/apps/<function-project-name>/package.json` - The ESM format package file for firebase CLI to process and deploy


## Functions & Nx-Firebase Applications

The Nx-firebase plugin requires that Firebase function projects must always be a dependency of a single Firebase application project:

*  This approach allows for multiple firebase projects in a single Nx workspace
*  It ensures all functions can be [managed by the nx-firebase plugin](./nx-firebase-sync.md)
*  Function application projects are added as `implicitDependencies` to the parent Firebase application, which ensures we can test, lint, build & deploy all functions from the top level Firebase application
*  Functions share the same Firebase `--config` CLI option as the parent Firebase Application
*  Functions share the same Firebase `--project` CLI option as the parent Firebase Application
*  You can create as many Firebase function projects as you like
*  Firebase function apps can export either just one or multiple firebase functions
*  When running the Firebase emulator using `serve`, **all** firebase function applications are built using `watch` mode, so local development is much more convenient


## Functions & Firebase Config

When new Firebase function applications are generated in the workspace:

* They are automatically added to the `functions[]` declaration in the project's `firebase.json` config file using the firebase CLI's `codebase` feature
* The `codebase` name assigned to the function in the config is the function applications project name. 
* When using firebase `deploy`, the CLI will deploy all `codebase`'s declared in the firebase config file




## Functions & ESBuild

`esbuild` is configured in the function's `project.json` to only bundle 'internal' source local to the workspace:
* Import paths using TS aliases to `@nx/js` libraries will be resolved as internal imports. 
* All external imports from `node_modules` will be added to the `package.json` as dependencies, since there is no good reason to bundle `node_modules` in node applications.

### Using ES Modules output

`esbuild` is also configured by default to always output bundled code as `esm` format modules:

* This ensures tree-shaking is activated in the bundling process
* Firebase functions with Node 16 or higher runtime all support ES modules
* The bundled output code in `dist` is _much_ cleaner to review
* We are only specifying that the _output_ bundle is `esm` format. The input source code sent to `esbuild` is Typescript code, which effectively uses ES6 module syntax anyway
* Therefore, it is not necessary to change your workspace to use `esm` format modules to use this plugin since `esbuild` builds from Typescript _source code_, not compiled JS.

### Using CommonJS output

If you still use Node `require()` in your Typescript function code, the default `esm` output setting for `esbuild` may not work. Your options are:
1. Refactor your code to use `import` instead of `require`
2. Modify the function `project.json` to set esbuild `format` to `['cjs']`
3. Generate your function applications with the `--format=cjs` option
  
Note that using `cjs` output may prevent tree-shaking optimizations.



### Why ESBuild?

While Webpack and Rollup are viable options for bundling node applications, `esbuild` is designed for node, it is fast, and it works very simply out of the box with Nx without any need for additional configuration files.


## Nx-Firebase Workspace Layout

Firebase applications and functions can be generated in whichever directories you like.

While there are plenty of ways to organise your workspace layout, one suggestion is:

```
/apps
    /project1
        /firebase
        /functions
          /function1
          /function2
        /web
            /site1-app
            /site2-app
        /mobile
            /app
    /project2
        /firebase
        /functions
        /web
        ...
firebase.rc
firebase.json
firebase.project2.json
```

## Node Environments / Runtimes for Firebase Functions

Firebase Functions are deployed by the Firebase CLI to specific Nodejs runtime environments.

The required runtime is automatically set by the nx-firebase plugin function generator, but can be manually changedt in the `firebase.json` configuration as a definition (eg. `nodejs16`, `nodejs18` etc.):

```
  "functions": [
    {
      "codebase": "firebase-project1",
      "runtime": "nodejs16",
      ...

    }    
  ],
```

Runtimes are recommended to be set to the same value for all functions in a project.
