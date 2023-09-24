# Firebase Sync

- [Firebase Sync](#firebase-sync)
  - [Nx-Firebase Sync Generator](#nx-firebase-sync-generator)
  - [Renaming Nx-Firebase Projects](#renaming-nx-firebase-projects)
    - [Renamed firebase application projects](#renamed-firebase-application-projects)
    - [Renamed firebase function projects](#renamed-firebase-function-projects)
  - [Deleting Nx-Firebase Projects](#deleting-nx-firebase-projects)
    - [Deleted firebase applications](#deleted-firebase-applications)
    - [Deleted firebase functions](#deleted-firebase-functions)
  - [Changing Firebase CLI Project](#changing-firebase-cli-project)
  - [Nx-Firebase Project Tags Reference](#nx-firebase-project-tags-reference)
    - [Tag Descriptions](#tag-descriptions)

## Nx-Firebase Sync Generator

Within an Nx workspace, Nx-firebase supports:
* Multiple firebase application projects
* Multiple firebase function projects attached to the firebase applications

Deleting or renaming any of these projects requires various project & firebase configurations to be updated to ensure that targets & deployments still work.

To help manage these scenarios, Nx-firebase has a `sync` generator to automate this work:

**`nx g @simondotm/nx-firebase:sync`** 

Run this command as soon as possible after any of these operations to ensure your Nx Firebase workspace is kept in sync:

* When Firebase application or function projects have been renamed
* When Firebase application or function projects have been deleted

The sync generator also runs some checks on your hosting configurations to validate & warn if there are any `public` paths that can't be matched to a Nx project in your workspace.

You can also use the `sync` generator to [change the Firebase project](#changing-firebase-cli-project) for an Nx Firebase App.
## Renaming Nx-Firebase Projects

Nx projects such as Firebase apps and Firebase function apps can be renamed using the `nx g move` generator.

Run the `nx g @simondotm/nx-firebase:sync` generator after the rename.

### Renamed firebase application projects

* Functions that are dependencies of the renamed firebase app will have their `deploy` target automatically updated to run this target from the newly renamed firebase application project

* Firebase applications with config files named as `firebase.my-project.json` that are used by the renamed app will also be renamed to match the new project name. 

* The `firebase:name:<old-project-name>` tag on the Firebase application's `project.json` will be updated to `firebase:name:<new-project-name>`

* Paths to rules and indexes for Firebase database, storage and firestore are updated in the `firebase.json` config

### Renamed firebase function projects

* Nx automatically updates `implicitDependencies` for renamed dependency projects (Firebase function apps are dependencies of Firebase applications)

* The `codebase` for the function in the firebase config will be renamed to match the new function name

* The `firebase:name:<old-project-name>` tag on the Firebase function's `project.json` will be updated to `firebase:name:<new-project-name>`

## Deleting Nx-Firebase Projects

Nx projects such as Firebase apps and Firebase function apps can be deleted using the `nx g remove` generator. 

Run the `nx g @simondotm/nx-firebase:sync` generator after the deletion.

> Note that when deleting a firebase function project, you may need to use the additional `--forceRemove` option, since Firebase function apps are implicit dependencies of Firebase apps and Nx will warn about this.

### Deleted firebase applications

* The Firebase config file linked to the deleted Firebase application project will be deleted
* Any Functions that were dependencies of the deleted firebase app will be reported as orphaned
* Orphaned functions can be either deleted, or they can be attached to another Firebase application project by:
  * Changing the `firebase:dep:<old-project>` tag to `firebase:dep:<new-project>`
  * Adding `<new-project>` to the `implicitDependencies` array in the new firebase app `project.json` file

### Deleted firebase functions

* Nx automatically updates `implicitDependencies` for deleted dependency projects (Firebase function apps are dependencies of Firebase applications)
* The deleted firebase function will also be deleted from the `firebase.json` config file

## Changing Firebase CLI Project

Nx Firebase applications have a `firebase` target that runs the Firebase CLI & specifies which `firebase.json` configuration is linked to this app (`--config`), and also which Firebase project it should use when being deployed (`--project`).

You can use the sync generator update the firebase project that is sent to the firebase CLI `--project` option for your Firebase application Nx project as follows:

**`nx g @simondotm/nx-firebase:sync --app=<firebase-app-project-name> --project=<firebase-cli-project-name>`**

All firebase commands used by the Nx project targets such as `deploy` will now send `--project=<firebase-project-name>` to the firebase CLI.


## Nx-Firebase Project Tags Reference

Various tags are added to projects generated by the plugin to help automatically detect changes in the firebase workspace and manage the `project.json` and `firebase.json` configuration files automatically.

### Tag Descriptions

* `firebase:app` - All firebase application projects have this tag
* `firebase:function` - All firebase function projects have this tag
* `firebase:name:<project-name>` - All firebase application & function projects have this tag
* `firebase:dep:<app-project-name>` - All firebase function projects have this tag

More details:

* The `firebase:dep` tag allows the `sync` generator to keep track of which firebase application project this function is associated with. It also allows us to `nx run-many` using tag specifiers when running `build`, `test`, `lint` or `watch` targets.

* The `firebase:name` tag allows the `sync` generator to detect when projects are renamed.

* The `firebase:app` and `firebase:function` tags simply allow us to easily identify Firebase projects in the workspace.

These tags work alongside any additional tags you might want to add to your Nx projects.



