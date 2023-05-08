# Optimizing Nx Libraries for Firebase Functions

Buildable libraries in Nx are typically used in environments where it is common to export the entire public API for a library in a single `index.ts` 'barrel' file, and then consuming some or all of this API by importing from this barrel export eg.

`import { stuff } from '@myorg/mylib'`

For Firebase functions however, we need to be efficient with our imports since each import has some impact on the [cold start time](https://firebase.google.com/docs/functions/tips#use_dependencies_wisely) of our functions because:

1. Importing an entire library from a barrel file is rarely optimal on a per-function basis
2. We are not doing any tree-shaking of our imports, since we're not (yet) using a bundler such as webpack
3. Buildable node libraries do not really support multiple entry points like Angular libraries do

So we ideally need a means of only importing the specific modules that our functions actually use from our libraries.

One option is to sub divide into multiple smaller libraries that are used by Firebase functions, however this can lead to too much fragmentation of shared code, and inconvenient splitting of library code in ways that prevent us from grouping libraries by functional scope.

## Deep Imports

An alternative solution for Firebase Functions is to use _deep imports_, that allow our functions to import only specific modules from node libraries, eg.

`import { SpecificModule } from '@myorg/mylib`**`/src/lib/specificmodule`**`'`

This approach means our buildable library is still packaged as `@myorg/mylib`, but we are able to import its internal modules as well as its public API.

### **Supporting deep imports with Nx Node libraries**

When we add buildable node libraries to our Nx workspace, the node library generator adds its own Typescript path alias to `compilerOptions.paths` in our workspace `tsconfig.base.json` such as:

`"@myorg/mylib": ["libs/mylib/src/index.ts"]`

This alias only allows node libraries or applications to import the library as `import { module } from '@myorg/mylib'` (the `main` entry point defined in our buildable library `package.json`), but if we also add an additional _wildcard_ path alias to our `tsconfig.base.json` such as:

`"@myorg/mylib/src/*": ["libs/mylib/src/*"]`

our functions code and libraries are now able to import other public API modules from `src` as:

`import { MyModule } from '@myorg/mylib/src/test`

(where `test.ts` is an additional public API barrel file for the library that perhaps exports some subset of the library functionality)

**Or**, we might choose to import modules more directly as:

`import { SomeModule } from '@myorg/mylib/src/lib/somemodule`

(where `SomeModule` is exported in `/libs/mylib/src/lib/somemodule.ts`)

### Notes

> _**Note: This technique is a trade off between best practice and performance.**_
>
> _Normally we'd discourage exposing the private implementations of libraries as a best practice, but for Firebase functions, cold start times are a genuine (and sometimes significant) side effect of importing unnecessary dependencies, so by directly deep importing only specific module from libraries we can improve runtime performance of our functions at the cost of exposing our private library implementations._

> Note also that the path aliases used must match the built library output directory structure in `dist`, because the `@nx/js:tsc` executor for buildable `@nx/js:lib` projects that import other buildable node libraries [generate temporary `tsconfig.generated.json` files for buildable node libraries](https://github.com/nrwl/nx/blob/d007d37fb4f625fc4854d06d2e083ed778d6a3db/packages/workspace/src/utilities/buildable-libs-utils.ts#L142) , and [automatically converts the Typescript compiler path aliases](https://github.com/nrwl/nx/blob/d007d37fb4f625fc4854d06d2e083ed778d6a3db/packages/workspace/src/utilities/buildable-libs-utils.ts#L217) in this temp config to point to the built `dist/libs/...` library output instead of the library source.
