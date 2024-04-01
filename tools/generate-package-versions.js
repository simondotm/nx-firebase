const path = require("path")
const fs = require("fs")

const generatedFile = path.join(__dirname, '..', 'packages', 'nx-firebase', 'src', '__generated__', 'nx-firebase-versions.ts')

const packageJson = require('../package.json')
const pluginVersion = require('../packages/nx-firebase/package.json').version
const nxVersion = packageJson.devDependencies['nx']
const nxMajorVersion = parseInt(nxVersion.split('.')[0])

// // read node version from .nvmrc
// const nvmVersion = fs.readFileSync(path.join(__dirname, '..', '.nvmrc'), 'utf8')
// const nodeVersion = nvmVersion.trim().split('.')[0]

// default firebase node version is to be derived from Nx version for now
// Nx 17+ offically suports Node 18, so may as well use that pattern
const nodeVersion = nxMajorVersion >= 17 ? '18' : '16'

const data = `
//------------------------------------------------------------------------------
// This file is automatically generated by tools/generate-package-versions.js
// Do not edit this file manually
//------------------------------------------------------------------------------
export const packageVersions = {
  pluginVersion: '${pluginVersion}',
  nx: '${nxVersion}',
  firebase: '${packageJson.devDependencies['firebase']}',
  firebaseAdmin: '${packageJson.devDependencies['firebase-admin']}',
  firebaseFunctions: '${packageJson.devDependencies['firebase-functions']}',
  firebaseFunctionsTest: '${packageJson.devDependencies['firebase-functions-test']}',
  firebaseTools: '${packageJson.devDependencies['firebase-tools']}',
  killPort: '${packageJson.devDependencies['kill-port']}',
  nodeEngine: '${nodeVersion}',
}
`


function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

console.log(`Writing package versions to '${generatedFile}'`)


ensureDirectoryExistence(generatedFile)
fs.writeFileSync(generatedFile, data)



