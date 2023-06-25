import { Tree } from '@nx/devkit'

export const gitIgnoreEntries = `

# Nx-Firebase
.runtimeconfig.json
**/.emulators/*
**/.firebase/*
database-debug.log
firebase-debug.log
firestore-debug.log
pubsub-debug.log
ui-debug.log
firebase-export*

`

export function addGitIgnoreEntry(host: Tree) {
  if (!host.exists('.gitignore')) {
    host.write('.gitignore', gitIgnoreEntries)
    return
  }

  const content = host.read('.gitignore')?.toString('utf-8')
  if (!content.includes(gitIgnoreEntries)) {
    host.write('.gitignore', content.concat(gitIgnoreEntries))
  }
}
