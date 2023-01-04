# Firebase Versions

- [Firebase Versions](#firebase-versions)
  - [Firebase Node Versions](#firebase-node-versions)
    - [Node 18 support](#node-18-support)
    - [Node 16 support](#node-16-support)
    - [Node 14 support](#node-14-support)
    - [Node 12 support](#node-12-support)
  - [ES Modules Support](#es-modules-support)
  - [Firebase Functions Versions](#firebase-functions-versions)
  - [Firebase Admin SDK Versions](#firebase-admin-sdk-versions)
  - [V2 Cloud Functions](#v2-cloud-functions)
  - [Nx-Firebase Plugin Defaults](#nx-firebase-plugin-defaults)

## Firebase Node Versions

### Node 18 support

- Currently in preview only for firebase functions
- Use [lastest version](https://github.com/firebase/firebase-tools/releases) of `firebase-tools`

### Node 16 support

- Node 16 is the currently [recommended runtime](https://cloud.google.com/functions/docs/concepts/nodejs-runtime) for firebase functions
- Supported as default from [version 10.0.0](https://github.com/firebase/firebase-tools/releases/tag/v10.0.0) of `firebase-tools`
- The latest Node 16 version is `16.19.0`
- Use functions runtime `nodejs16`
- Recommend minimum [version 10](https://github.com/firebase/firebase-tools/releases/tag/v10.9.2) of `firebase-tools` for Node 16

### Node 14 support

- The latest Node 14 version is `14.21.2`
- Recommend minimum [version 9](https://github.com/firebase/firebase-tools/releases/tag/v9.23.3) of `firebase-tools` for Node 14
- Use functions runtime `nodejs14`
- Node 14 introduces ESM support (see below)

### Node 12 support

- Node 12 support was dropped in [version 11.0.0](https://github.com/firebase/firebase-tools/releases/tag/v11.0.0) of the firebase tools.
- Use [version 9](https://github.com/firebase/firebase-tools/releases/tag/v9.23.3) or [version 10](https://github.com/firebase/firebase-tools/releases/tag/v10.9.2) of `firebase-tools` if you require Node 12, but note that it is now deprecated.
- `firebase-functions` supported upto [version 3](https://github.com/firebase/firebase-functions/releases/tag/v3.24.1)
- `firebase-admin` upto [version 9]()

## ES Modules Support

- [ES Modules are supported](https://cloud.google.com/functions/docs/concepts/nodejs-runtime#using_es_modules) in Node 14+ runtimes
- Recommend minimum `firebase-functions` minimum [version 9.16.2+](https://github.com/firebase/firebase-tools/releases/tag/v9.16.2) (which has `@google-cloud/functions-framework@1.9.0`)
- At least [version 9](https://github.com/firebase/firebase-tools/releases/tag/v9.23.3) of `firebase-tools` is necessary, but later versions likely to provide better support

## Firebase Functions Versions

- [Latest Github Release](https://github.com/firebase/firebase-functions/releases)
- [Version 4.0.0+](https://github.com/firebase/firebase-functions/releases/tag/v4.0.0) of `firebase-functions`
  - drops support for Node 8, 10, 12
  - drops support for `firebase-admin` versions 8 and 9

## Firebase Admin SDK Versions

- [Latest Github Release](https://github.com/firebase/firebase-admin-node/releases)
- [Version 11.2.0+](https://firebase.google.com/support/release-notes/admin/node#cloud-firestore_2)
  - Adds support for `@google-cloud/firestore` v6.4.0 to support `COUNT` queries
- [Version 11.0.0+](https://firebase.google.com/support/release-notes/admin/node#version_1100_-_16_june_2022)
  - Drops support for Node 12
  - Upgrades `@google-cloud/firestore` to v5 which may contain breaking changes
  - Upgrades `@google-cloud/storage` to v6 which may contain breaking changes
- [Version 10.0.0+](https://firebase.google.com/support/release-notes/admin/node#version_1000_-_14_october_2021)
  - Drops support for Node 10
  - Supports ES Modules
- [All Release Notes](https://firebase.google.com/support/release-notes/admin/node)

## V2 Cloud Functions

A [2nd generation of cloud functions](https://firebase.google.com/docs/functions/beta) became [generally available](https://cloud.google.com/blog/products/serverless/cloud-functions-2nd-generation-now-generally-available) in August 2022 with main differences for v2 functions:

- Concurrency for function instances
- Now uses Cloud Run for improved efficiency
- New trigger types
- Improved cold-starts, minimum instances etc.

See also [Cloud Functions version comparison](https://cloud.google.com/functions/docs/concepts/version-comparison).

The [2nd generation of firebase functions](https://firebase.google.com/docs/functions/beta) is currently in beta preview and it's unclear at this time when that will end.

Using v2 functions requires `import * as functionsV2 from "firebase-functions/v2"`

## Nx-Firebase Plugin Defaults

`nx-firebase` plugin does not require or enforce any particular versions of firebase packages/cli.

That said, typically only certain combinations of Nx/Firebase/Node versions make sense and it can be tricky to get versions aligned depending on which workspace configurations are required for a project.

New applications generated in new Nx workspaces by `@simondotm/nx-firebase` will install:

- Functions with `nodejs16` runtime enabled
- `firebase-tools` version 11
- `firebase-functions` version 4
