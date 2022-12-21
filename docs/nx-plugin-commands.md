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
