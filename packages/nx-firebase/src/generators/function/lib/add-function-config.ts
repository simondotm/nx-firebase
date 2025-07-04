import { Tree, joinPathFragments, updateJson } from '@nx/devkit'
import type { FirebaseConfig, FirebaseFunction } from '../../../types'
import type { FunctionGeneratorNormalizedSchema } from '../schema'

export function addFunctionConfig(
  tree: Tree,
  options: FunctionGeneratorNormalizedSchema,
): void {
  updateJson(tree, options.firebaseConfigName, (json: FirebaseConfig) => {
    const functionConfig = {
      codebase: options.projectName,
      source: joinPathFragments('dist', options.projectRoot),
      runtime: `nodejs${options.runTime}`,
      ignore: ['*.local'],
    }

    // console.log(`json.functions=${JSON.stringify(json.functions)}`)
    if (!Array.isArray(json.functions)) {
      const existingFunction = Object.assign({}, json.functions)
      json.functions = []
      if (Object.keys(existingFunction).length) {
        json.functions.push(existingFunction)
      }
    }
    json.functions.push(functionConfig)
    // sort the codebases to be neat & tidy
    json.functions.sort((a: FirebaseFunction, b: FirebaseFunction) => {
      return a.codebase < b.codebase ? -1 : a.codebase > b.codebase ? 1 : 0
    })
    return json
  })
}
