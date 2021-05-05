# @simondotm/nxfirebase

An experimental plugin for [Nx](https://nx.dev) that provides support for Firebase projects in an Nx monorepo workspace.

This project was generated using the Nx plugin workspace generator.

> **Note**: This project is the work of a couple of days, and I'm not at all yet fluent with the inner workings of Nx plugins so its pretty hacky/basic just now. It does what I needed it to do, and so maybe it will be useful to others also.


## To build the plugin

`nx run nxfirebase:build`

## To test the plugin

`nx run nxfirebase-e2e:e2e`

Creates a temporary workspace in `/tmp/nx-e2e/`

After the e2e test has completed, the plugin can be further manually tested in this temporary workspace.

## Purpose

Nx provides a great way to manage monorepo workflows, however if you have a development setup where your Nx workspace contains _multiple_ Firebase projects that use different combinations and configurations of Firebase features such as _hosting_, _storage_, _database rules/indexes_, and _functions_, then some extra tooling is necessary in order to maintain a familiar Firebase workflow within your monorepo.

The principle aims of this plugin are to:
1. Enable sharing of common backend (Firebase functions) microservice code as _plain old typescript libraries_ across all these projects
2. Retain the typical firebase project layout as closely as possible to ease migration and maintain existing CLI based workflows that we firebase developers are used to.
3. Require no additional configuration of an Nx workspace in order to use a Firebase project

## Setup
**`npm install @simondotm/nxfirebase`**

Installs this plugin into your Nx workspace.

## Usage

**`nx g @simondotm/nxfirebase:init`**

Installs firebase dependencies (both for backend and frontend) to your root workspace `package.json` (or you can just `npm install` firebase dependencies manually)

**`nx g @simondotm/nxfirebase:app <myfirebaseappname>`**

Generates a new firebase application in the workspace - `/apps/myfirebaseappname`

**`nx g @simondotm/nxfirebase:functions <myfirebaseappname>`**

Generates a new firebase `functions` application as a child of the parent - `apps/myfirebaseappname/functions` which contains a Typescript `src` folder and the Firebase functions `package.json` file that the Firebase CLI needs when deploying functions.

**`nx build:myfirebaseapp`**

Copies the firebase config files to `dist/apps/myfirebaseapp`

**`nx build:myfirebaseapp/functions`**

Compiles & builds the functions project to the `dist/apps/myfirebaseapp/functions` folder.

### Firebase web apps
If you have one or more other web apps (Angular/React/HTML) that are deployed to a hosting site on your Firebase project, simply add them as child projects of `myfirebaseapp` using the Nx CLI as usual, for example:

**`nx g @nrwl/angular:app myfirebaseapp/myangularfirebasewebapp`**

When you build this application, it will be built to `dist/apps/myfirebaseapp/myangularfirebasewebapp/...` and your `firebase.json` config can reference it there as usual.

## Deployment

To deploy (sites, rules, functions etc.) to your firebase project, just be sure to run the usual Firebase CLI `firebase --deploy xxx` from the `dist/apps/myfirebaseapp` folder.

For example:

```
cd /dist/apps/myfirebaseapp
firebase deploy --only functions
firebase deploy --only hosting:myangularfirebasewebapp
```

# Overview
This plugin makes three assumptions in its approach:
1. That we have a _root_ Firebase "application" in our workspace that contains all of the firebase configuration files (which you might normally have in the root of your workspace)
2. That any website or functions applications that deploy to this firebase project are child applications within the workspace
3. That when we want to use the Firebase CLI for deployment, we'll do that from the workspace `/dist/...` folder

So I figure this can be done neatly by exploiting the fact that Nx workspaces support parent-child (or scoped if you prefer) hierarchies of applications.

Here's my approach:
1. We will treat "firebase projects" as Nx applications in their own right. These applications have no source code, but they do have configuration assets - `firebase.json` and `firestore.rules` etc. files located within it. Building this application will use a custom builder that will simply copy these configuration files to the `dist/apps/myfirebaseapp` folder
2. Then we'll place any applications (hosted applications or APIs etc.) that are related to this firebase project into child folders in the workspace - eg. `apps/myfirebaseapp/my-web-app-that-uses-firebase-configs-from-myfirebaseapp`
3. We'll treat the firebase functions within a firebase project again as a child application of the parent firebase application eg. `apps/myfirebaseapp/functions` and have it built as a simple `@nrwl/node:package` which will simply compile the typescript to dist, but not bundle it. 

So our workspace structure is as follows:
```
workspace/apps/
└── myfirebaseapp/
    ├── firebase.json, firestore.indexes etc.
    ├── myfirebasewebapp1/ [your angular/react/html/whatever web app goes here, built by the usual Nx builders that you like]
    ├── myfirebasewebapp2/[as above]
    └── functions/
            ├── src/ [your TS functions code goes here and it can import any library from your Nx workspace as you like]
            └── package.json [only needed for firebase deploy CLI, will be simply copied to `dist/apps/myfirebaseapp/functions`]
```
The dist folder looks like this:
```
dist/apps/
└── myfirebaseapp/
    ├── firebase.json, firestore.indexes etc.
    ├── myfirebasewebapp1/ [bundled web app that can be deployed to fb hosted site as usual]
    ├── myfirebasewebapp2/ [as above]
    └── functions/
            ├── lib/ [compiled functions code with index.js as entry point as usual]
            └── package.json [the dependencies for the functions code, used by FB CLI when deploying to build your function container's node_modules]
```
We can now deploy as usual using the firebase CLI from any of these folders in dist, because the parent directory contains the Firebase configs (indeed the `firebase.json` can/should be configured to point to these dist folders accordingly)

Deploying functions is also straightforward by running `firebase -deploy functions` from `dist/myfirebaseapp/functions` since the functions `package.json` file, `lib/index.js` is in there as expected (along with any other compiled `commonjs` modules used by the functions you have).

The good things about this approach are:
1. that it allows any number of different firebase projects to co-exist within an Nx workspace without need for any path hacking or workarounds. 
2. We also get the full benefit of shared library code in functions because in an Nx monorepo, we are only ever referencing library packages as local files, so they get imported directly into the functions code that is deployed. (and using private npm packages with firebase functions is a productivity hot mess we can all live without I'm sure.)
3. It feels integrated with Nx workflow, without pushing unwanted opinions onto any existing Firebase project workflows folks may have. We can organise and manage our FB functions code however we like - this approach wont get in the way of that. 
4. We do not webpack our functions code (because there's absolutely no reason or benefit to do this with FB functions), nor will we include any code in our functions that isn't used. We will only ever deploy exactly the modules that the function code references.
5. We get the benefit of Nx dependency graph. Changes to a library that is use by functions code in multiple firebase projects will trigger the necessary rebuilds of affected "functions" applications.


## Future features
It feels like there could be a lot more utility added to this plugin (such as maybe automating dependencies in the functions `package.json`, adding deployment executors etc.), but for now I'd thought I'd just share the the early version to see what feedback is like.


