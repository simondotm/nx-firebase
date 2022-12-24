## Firebase Functions

An Nx-Firebase app is essentially a Firebase _functions_ directory (along with the few other configuration files as mentioned above). The main difference is that there isn't a directory called `functions` which you may be used to from projects setup by the Firebase CLI; with Nx-Firebase your app directory IS your functions folder.

Inside the new `apps/appname` directory you will find the following functions-specific files:

- `package.json` - The stub package file used when deploying firebase functions
- `src` - Your Firebase functions code goes in here. You are free to structure your code however you like in this directory
- `tsconfig.json` and `tsconfig.app.json` as usual

> **Note:** _Firebase functions `tsconfig.app.json` is by default set to target `es2018` which is the maximum ES version for Node 10 engine. This override exists in case the root `tsconfig.base.json` sets an ES target that is incompatible with Firebase Functions Node environment. If you are using Node 12 engine, you can change this target to `es2019`._

## Nx-Firebase Application Naming

You may find it convenient/familiar to create your Nx-Firebase application simply with `functions` as it's app name eg. `nx g @simondotm/nx-firebase:app functions`.

If you have multiple Firebase projects in your workspace, the Nx-Firebase application generator supports the `--directory` option, so you may also find it convenient to organise your workspace as follows:

`apps/<projectname>/...<projectapps>`

And generate your app as follows:

`nx g @simondotm/nx-firebase:app functions --directory projectname`

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
