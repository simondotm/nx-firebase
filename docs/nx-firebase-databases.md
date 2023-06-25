# Firebase Databases

`nx-firebase` assumes you may wish to use either realtime and/or firestore database.

## Rules & Indexes

To keep the root of your Nx workspace tidy, the Nx-Firebase plugin puts default Firebase rules and index files inside the nx-firebase appliocation folder, and the `firebase.json` or `firebase.<app-name>.json` configuration file simply points to them there.

Again, this works just fine with the usual Firebase CLI command, eg:

**`firebase deploy --only firestore:rules --config firebase.appname.json`**

Or

**`nx deploy appname --only firestore:rules`**

This is also useful for cleaner separation if you have multiple Firebase projects in your Nx workspace.

Again, you are free to modify these locations or remove these cloud features if you wish by simply changing the Firebase configuration files; the `nx-firebase` plugin does not use these configuration files in any way.
