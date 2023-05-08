# Using Nx Libraries within nested sub-directories

If you create Nx Libraries in subdirectories, you should use `--importPath` when generating the buildable library, because `@nx/node:lib` by default generates library path aliases that are incompatible with `npm` package naming and also Firebase functions deployment. See [Github discussion here](https://github.com/nrwl/nx/issues/2794).

For instance:

**`nx g @nx/node:lib nodelib --directory subdir --buildable`**

will generate Typescript path alias and `package.json` name of `@myorg/subdir/nodelib` (note the extra backslash separator) which isn't compatible with how Firebase functions are deployed.

Instead, when generating sub-directory Nx libraries that will be used by Firebase functions, use the `--importPath` feature to ensure the library has a compatible package name. eg.

**`nx g @nx/node:lib nodelib --directory subdir --buildable --importPath='@myorg/subdir-nodelib'`**

> _**Note:** The Nx-Firebase plugin will detect if any such libraries are imported by a firebase application, and halt compilation._

## Publishable vs Buildable Nx Node Libraries

As of Nx 12.3.4, there doesn't seem to be much difference between a `--publishable` and a `--buildable` node library. The docs _suggest_ the builder for publishable libraries [generates optimized/webpack code](https://nx.dev/latest/angular/structure/buildable-and-publishable-libraries) but this doesn't seem to be the case in practice.

Both options have `@nx/js:tsc` as the builder target, and both generate a `package.json` file for the library, but using `--publishable` when generating a library will require that `--importPath` is specified.

Both of these library options are compatible with Nx-Firebase applications.
