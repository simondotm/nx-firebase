# Unsupported features

## Project specific Typescript Paths

If you use `ModuleAlias` and TSC path aliases in your Firebase functions (as I once did), please note that I've not yet figured out how to support project-specific `tsc` `paths` in the Typescript configurations. It seems tricky since Nx uses path aliases in the workspace root `tsconfig` for library imports, and adding any path overrides in applications will overwrite these. The best workaround I can think of is to add global aliases with some naming convention to the workspace root TSC config... If anyone has any better ideas they'd be very welcome!

Update Dec'22: `ModuleAlias` is generally deprecated now, and not recommended as a runtime solution. It's also an anti-pattern in monorepos, since monorepos intrinsically encourage and support slicing application code into libraries that can each have their own `importPath`.

## Firebase Function Codebases

Are not yet supported, but will be supported in a future version of the plugin. In the meantime the firebase configurations can be manually configured by users to support this if required.

## Firebase Function Environments

Are not yet supported, but may be supported in a future version of the plugin

## ES Modules

Since ESM is where node projects are likely all headed, future versions of the plugin may add support for this.

## Plugin Migration

There is currently no migration script for this plugin. See [Nx Migration](nx-migration.md) for more details.
