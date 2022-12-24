## Unsupported features

**Project specific Typescript Paths**

If you use `ModuleAlias` and TSC path aliases in your Firebase functions (as I do), please note that I've not yet figured out how to support project-specific `tsc` `paths` in the Typescript configurations. It seems tricky since Nx uses path aliases in the workspace root `tsconfig` for library imports, and adding any path overrides in applications will overwrite these. The best workaround I can think of is to add global aliases with some naming convention to the workspace root TSC config... If anyone has any better ideas they'd be very welcome!
