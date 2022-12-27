# Supporting Nx Libraries in Functions

Supporting Nx libraries as external packages with Firebase functions is slightly tricky. The solution the Nx-Firebase plugin uses is to use [local package references](https://firebase.google.com/docs/functions/handle-dependencies#including_local_nodejs_modules).

Nx-Firebase has a custom build executor which is based on the `@nrwl/js:tsc` executor, with a few additional build steps.

1. It compiles any node libraries that are dependents of our Firebase application
2. It compiles the Firebase application functions code as a pure buildable Typescript library package
3. It auto-generates npm dependencies in the output `package.json`
4. It makes a copy of all dependent node libraries in `dist/apps/appname/libs/...`
5. It makes another copy of these libraries in `dist/apps/appname/node_modules/...`
6. It transforms any local library package dependencies in the output `package.json` to use local file references to the local `./libs/...` folder eg.

```
"@myorg/mylib": "0.0.1" => "@myorg/mylib": "file:libs/mylib"
```

These extra steps ensure that the Firebase CLI can deploy functions with all of the correct dependencies and local libraries fully self contained within the `dist/apps/appname` directory (which pleases the CLI).

The reason why we make an additional copy of dependent libraries to the `node_modules` folder is because the Firebase CLI runs some checks (and partially processes the primary functions entry point node script) prior to deployment to ensure everything is in order.

There's no need to do a full `npm install` here, we only have to ensure local libraries exist inside `node_modules` at deployment time.

The Firebase CLI doesn't upload the `node_modules` folder, only the `./src` and `./libs` folders.

Firebase functions does support [private packages](https://firebase.google.com/docs/functions/handle-dependencies#using_private_modules), but they are frankly a bit of a headache, so packaging libraries locally is a much neater solution, and actually works pretty nicely with Nx workspace workflow.
