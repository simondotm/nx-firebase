import { logger, Tree } from '@nrwl/devkit'

export const gitIgnoreEntries = `
# Nx-Firebase
.runtimeconfig.json
`

export function addGitIgnoreEntry(host: Tree) {
  if (!host.exists('.gitignore')) {
    // logger.warn(`Couldn't find .gitignore file to update`)
    host.write('.gitignore', '')
    //    return
  }

  let content = host.read('.gitignore')?.toString('utf-8').trimEnd()

  if (!/\.expo\/$/gm.test(content)) {
    content = `${content}\n${gitIgnoreEntries}\n`
  }

  host.write('.gitignore', content)
}
