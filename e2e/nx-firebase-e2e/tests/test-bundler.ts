import {
  readJson,
  uniq,
  updateFile,
  checkFilesExist,
  readFile,
} from '@nx/plugin/testing'

import {
  appGeneratorAsync,
  cleanAppAsync,
  cleanFunctionAsync,
  functionGeneratorAsync,
  getProjectData,
  validateFunctionConfig,
  runTargetAsync,
  getMainTs,
  getLibImport,
  addImport,
  expectStrings,
} from '../test-utils'

import {
  buildableLibData,
  nonbuildableLibData,
  subDirBuildableLibData,
  subDirNonbuildableLibData,
} from './test-libraries'

//--------------------------------------------------------------------------------------------------
// Test import & dependency handling
//--------------------------------------------------------------------------------------------------
export function testBundler() {
  describe('nx-firebase bundle dependencies', () => {
    it('should inline library dependencies into function bundle', async () => {
      // use libs we generated earler

      const appData = getProjectData('apps', uniq('firebaseDepsApp'))
      const functionData = getProjectData('apps', uniq('firebaseDepsFunction'))
      await appGeneratorAsync(appData)
      await functionGeneratorAsync(functionData, `--app ${appData.projectName}`)

      validateFunctionConfig(functionData, appData)

      // add buildable & nonbuildable lib dependencies using import statements
      let mainTs = getMainTs()

      // import from a buildable lib
      const libImport1 = getLibImport(buildableLibData)
      const importAddition1 = `import { ${libImport1} } from '${buildableLibData.npmScope}'\nconsole.log(${libImport1}())\n`
      mainTs = addImport(mainTs, importAddition1)

      // import from a non buildable lib
      const libImport2 = getLibImport(nonbuildableLibData)
      const importAddition2 = `import { ${libImport2} } from '${nonbuildableLibData.npmScope}'\nconsole.log(${libImport2}())\n`
      mainTs = addImport(mainTs, importAddition2)

      // import from a buildable subdir lib
      const libImport3 = getLibImport(subDirBuildableLibData)
      const importAddition3 = `import { ${libImport3} } from '${subDirBuildableLibData.npmScope}'\nconsole.log(${libImport3}())\n`
      mainTs = addImport(mainTs, importAddition3)

      // import from a non buildable subdir lib
      const libImport4 = getLibImport(subDirNonbuildableLibData)
      const importAddition4 = `import { ${libImport4} } from '${subDirNonbuildableLibData.npmScope}'\nconsole.log(${libImport4}())\n`
      mainTs = addImport(mainTs, importAddition4)

      // write the new main.ts
      updateFile(functionData.mainTsPath, (content: string) => {
        return mainTs
      })

      // confirm the file changes
      const updatedMainTs = readFile(functionData.mainTsPath)
      expect(updatedMainTs).toContain(importAddition1)
      expect(updatedMainTs).toContain(importAddition2)
      expect(updatedMainTs).toContain(importAddition3)
      expect(updatedMainTs).toContain(importAddition4)

      // build
      const result = await runTargetAsync(functionData, `build`)
      // check console output
      expectStrings(result.stdout, [
        `Running target build for project ${functionData.projectName}`,
        `nx run ${buildableLibData.projectName}:build`,
        `nx run ${subDirBuildableLibData.projectName}:build`,
        `Compiling TypeScript files for project "${subDirBuildableLibData.projectName}"`,
        `Compiling TypeScript files for project "${buildableLibData.projectName}"`,
        `Done compiling TypeScript files for project "${buildableLibData.projectName}"`,
        `Done compiling TypeScript files for project "${subDirBuildableLibData.projectName}"`,
        `nx run ${functionData.projectName}:build`,
        `Successfully ran target build for project ${functionData.projectName}`,
      ])
      expectStrings(result.stderr, [`${functionData.distDir}/main.js`])
      // make sure output build is not megabytes in size, which would mean we've
      // bundled node_modules as well
      expect(result.stdout).not.toContain('Mb')

      // check dist outputs
      expect(() =>
        checkFilesExist(
          `${functionData.distDir}/package.json`,
          `${functionData.distDir}/main.js`,
          `${functionData.distDir}/.env`,
          `${functionData.distDir}/.env.local`,
          `${functionData.distDir}/.secret.local`,
        ),
      ).not.toThrow()

      // check dist package contains external imports
      const distPackage = readJson(`${functionData.distDir}/package.json`)
      const deps = distPackage['dependencies']
      expect(deps).toBeDefined()
      // firebase-admin not in the template anymore
      // expect(deps['firebase-admin']).toBeDefined()
      expect(deps['firebase-functions']).toBeDefined()

      // check bundled code contains the libcode we added
      const bundle = readFile(`${functionData.distDir}/main.js`)

      // check that node modules were not bundled, happens in e2e if nx reset not called
      // probably the earlier check for deps in the package.json already detects this scenario too
      expect(bundle).not.toContain(`require_firebase_app`)

      // our imported lib modules should be inlined in the bundle
      expect(bundle).toContain(`function ${libImport1}`)
      expect(bundle).toContain(`return "${buildableLibData.projectName}"`)
      expect(bundle).toContain(`function ${libImport2}`)
      expect(bundle).toContain(`return "${nonbuildableLibData.projectName}"`)
      expect(bundle).toContain(`function ${libImport3}`)
      expect(bundle).toContain(`return "${subDirBuildableLibData.projectName}"`)
      expect(bundle).toContain(`function ${libImport4}`)
      expect(bundle).toContain(
        `return "${subDirNonbuildableLibData.projectName}"`,
      )

      // cleanup
      await cleanFunctionAsync(functionData)
      await cleanAppAsync(appData)
    })
  })
}
