# Nx-Firebase Workspace Layout

Firebase applications and functions can be generated in whichever directories you like.

While there are plenty of ways to organise your workspace layout, one suggestion is:

```
/apps
    /project1
        /firebase
        /functions
          /function1
          /function2
        /web
            /site1-app
            /site2-app
        /mobile
            /app
    /project2
        /firebase
        /functions
        /web
        ...
firebase.rc
firebase.json
firebase.project2.json
...
```

## Organising functions

Since [firebase function projects](./nx-firebase-functions.md) are apps, and nx-firebase supports multiple functions for each firebase app, there is plenty of flexibility for how you wish to develop your cloud functions.



1. Just have one function Nx app project that exports all of the cloud functions you need
2. Have multiple Nx function app projects which group and export multiple cloud functions by common functionality
3. Have one Nx function app project per cloud function

Option 1 is the simplest approach.

However, over time as your project grows you may find that options 2 or 3 bring organisational benefits, (and also potentially code start time optimisations as separated function app projects will only import the code they need to compile). 

Firebase CLI also has capability to check for unchanged function code when deploying, so having more codebases can also reduce the deployment time for your functions.
