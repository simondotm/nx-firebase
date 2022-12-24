# Technical Notes

This plugin builds on a number of interesting conversations in the Nx Github issues regarding use of Firebase within Nx. At the time of writing, there were various workarounds and tooling solutions, which didn't quite hit the spot for me, hence I did some of my own experimentation to see what could be done.

The main feature I wanted was to be able to easily build & deploy Firebase functions in a way that would be familiar (Firebase CLI) but also leverage the power of Nx libraries to share common backend code across multiple Firebase projects.

Firebase is quite particular about how it deploys functions code to GCP, in so much that:

1. It does not upload `node_modules` folder, and
2. It requires all code used by all functions to be self-contained within the `functions` directory that is set in the `firebase.json` [configuration file](https://firebase.google.com/docs/functions/manage-functions#deploy_functions).

An additional constraint is that we do not want to use Webpack for building function code because:

1. It prevents us from using dynamic function exports that optimize cold starts (since webpack bundles all functions and all exports into one module)
2. With Firebase functions, there's really no need or benefit to optimize, minify or otherwise change the compiled JS we upload

Other considerations:

1. We do care about only deploying functions code that is relevant to the functions being deployed (some workarounds upload all of the workspace)
2. The Firebase CLI is great and familar, so we don't really want to have to add any extra complexity or wrappers around it if we can help it.
