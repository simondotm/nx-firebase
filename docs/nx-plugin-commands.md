# Nx Plugin Development

Notes mainly for my own benefit/reminder here.

## To create the plugin workspace

- `npx create-nx-plugin simondotm --pluginName nx-firebase`

## To build the plugin

- `nx run nx-firebase:build`

## To test the plugin

- `nx run nx-firebase:test`

## To run end-to-end tests for the plugin

- `nx run nx-firebase-e2e:e2e`
- This creates a temporary workspace in `/tmp/nx-e2e/...`
- After the e2e test has completed, the plugin can be further manually tested in this temporary workspace.

## To reformat the project

For example, after changing `.prettierrc` settings

- `nx format:write --all`

**Unit Tests**

I've not implemented a full set of unit tests yet, but the e2e tests do perform a few standard tests.

> **Note**: I created this plugin to primarily serve my own needs, so feature requests may take a bit of time to consider, but feedback and collaboration is very welcome for this project, since the Nrwl Nx team have an extremely rapid release cadence and it's sometimes hard to keep up with all the changes!
