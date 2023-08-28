import { Tree } from '@nx/devkit'

export const gitIgnoreEntries = [
  '# Nx-Firebase',
  '.runtimeconfig.json',
  '**/.emulators/*',
  '**/.firebase/*',
  'database-debug.log',
  'firebase-debug.log',
  'firestore-debug.log',
  'pubsub-debug.log',
  'ui-debug.log',
  'firebase-export*',
]

export function addGitIgnoreEntry(host: Tree) {
  if (!host.exists('.gitignore')) {
    host.write('.gitignore', `${gitIgnoreEntries.join('\n')}\n`)
    return
  }

  let content = host.read('.gitignore')?.toString('utf-8')
  let updated = false
  for (const entry of gitIgnoreEntries) {
    if (!content.includes(entry)) {
      content += `${entry}\n`
      updated = true
    }
  }
  if (updated) {
    host.write('.gitignore', content)
  }
}
