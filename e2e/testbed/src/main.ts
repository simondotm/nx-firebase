/**
 * Custom e2e test suite for @simondotm/nx-firebase Nx plugin
 * The plugin e2e test suite can be unreliable and has limitations in Jest
 * This script allows us to run full matrix e2e and regression tests of the plugin across:
 * - Node versions 14,16,18
 * - Nx versions against plugin versions
 * - Check firebase deployments in CI environment
 */
import { exec } from 'child_process'
import * as fs from 'fs'
import { readJsonFile, writeJsonFile } from '@nrwl/devkit'
import { exit } from 'process'

const defaultCwd = process.cwd()
console.log(`cwd=${defaultCwd}`)

async function customExec(command: string, dir?: string) {
  const cwd = dir ? dir : process.cwd()
  return new Promise((resolve, reject) => {
    console.log(`Executing command '${command}' in '${cwd}'`)
    const process = exec(command, { cwd: cwd }, (error, stdout, stderr) => {
      if (error) {
        console.warn(error)
        reject(error)
      }
      resolve(stdout ? stdout : stderr)
    })

    process.stdout.on('data', (data) => {
      console.log(data.toString())
    })

    process.stderr.on('data', (data) => {
      console.log(data.toString())
    })

    process.on('exit', (code) => {
      if (code) {
        console.log('child process exited with code ' + code.toString())
      }
    })
  })
}

function setCwd(dir) {
  console.log(`Switching cwd to '${dir}'`)

  process.chdir(dir)

  console.log(`Switched cwd to '${process.cwd()}'`)
}

/**
 * Replace content in the application `index.ts` that matches `importMatch` with `importAddition`
 * @param match - string to match in the index.ts
 * @param addition - string to add after the matched line in the index.ts
 */
function addContentToIndexTs(
  indexTsPath: string,
  match: string,
  addition: string,
) {
  const content = fs.readFileSync(indexTsPath, 'utf8')
  const replaced = content.replace(match, `${match}\n${addition}`)
  fs.writeFileSync(indexTsPath, replaced)
}

function expect(content: string, toContain: string) {
  return content.includes(toContain)
}

async function testNxVersion(nxVersion: string) {
  const testDir = `${defaultCwd}/tmp/test/${nxVersion}`
  const workspaceDir = `${testDir}/myorg`

  console.log(
    `Creating new Nx workspace version ${nxVersion} in directory '${testDir}'`,
  )

  if (!fs.existsSync(testDir)) {
    console.log(`Creating test dir '${testDir}'...`)
    fs.mkdirSync(testDir)
  }

  if (fs.existsSync(workspaceDir)) {
    console.log(`Cleaning workspace '${testDir}'...`)
    fs.rmSync(workspaceDir, { recursive: true, force: true })
  }

  setCwd(testDir)

  await customExec(
    `npx create-nx-workspace@${nxVersion} --preset=apps --interactive=false --name=myorg --nxCloud=false`,
  )

  setCwd(workspaceDir)

  //   console.log('Updating package.json')
  //   const packageFilename = `${workspaceDir}/package.json`
  //   const packageFile = readJsonFile(packageFilename)
  //   console.log(packageFile.devDependencies)

  //   packageFile.devDependencies['@simondotm/nx-firebase'] =
  //     // 'file:../../../../dist/packages/nx-firebase'
  //     '0.3.4'
  //   writeJsonFile(packageFilename, packageFile)

  //   await customExec('npm i')
  //   await customExec('npm i @nrwl/js@13.10.6')
  //   await customExec(
  //     `npm i @simondotm/nx-firebase@0.3.4 --save-dev --prefix ${workspaceDir}`,
  //   )
  await customExec(`npm i @nrwl/js@${nxVersion} --save-dev`)
  await customExec(`npm i @simondotm/nx-firebase@0.3.4 --save-dev`)

  await customExec('npx nx g @simondotm/nx-firebase:app functions')
  await customExec(
    'npx nx g @nrwl/js:lib lib1 --buildable --importPath="@myorg/lib1"',
  )
  await customExec('npx nx build lib1')
  await customExec('npx nx build functions')

  // update index.ts so that deps are updated after creation
  const importMatch = `import * as functions from 'firebase-functions';`
  addContentToIndexTs(
    `${workspaceDir}/apps/functions/src/index.ts`,
    importMatch,
    '// comment added',
  )
  await customExec('npx nx build functions')

  // add a lib dependency
  const importAddition = `import { lib1 } from '@myorg/lib1'\nconsole.log(lib1())\n`
  addContentToIndexTs(
    `${workspaceDir}/apps/functions/src/index.ts`,
    importMatch,
    importAddition,
  )
  await customExec('npx nx build functions')

  console.log('done')
}

async function main() {
  await testNxVersion('13.10.6')
}

main()
