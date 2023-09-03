import { Tree } from '@nx/devkit'

export const gitIgnoreRules = [
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
  '.secret.local',
]

// these rules tell nx to override .gitignore and consider these files as dependencies
export const nxIgnoreRules = [
  '# Nx-Firebase',
  '!.secret.local',
  '!.runtimeconfig.json',
]

function addIgnoreRules(host: Tree, ignoreRules: string[], ignoreFile: string) {
  if (!host.exists(ignoreFile)) {
    host.write(ignoreFile, `${ignoreRules.join('\n')}\n`)
    return
  }

  let content = host.read(ignoreFile)?.toString('utf-8')
  let updated = false
  for (const entry of ignoreRules) {
    if (!content.includes(entry)) {
      content += `${entry}\n`
      updated = true
    }
  }
  if (updated) {
    host.write(ignoreFile, content)
  }
}

export function addGitIgnore(host: Tree) {
  addIgnoreRules(host, gitIgnoreRules, '.gitignore')
}

export function addNxIgnore(host: Tree) {
  addIgnoreRules(host, nxIgnoreRules, '.nxignore')
}
