import { Tree, joinPathFragments, updateJson } from '@nx/devkit'
import { FirebaseConfig, FirebaseFunction } from '../../../utils'
import { NormalizedOptions } from '../schema'

export function addFunction(tree: Tree, options: NormalizedOptions) {
  updateJson(tree, options.firebaseConfigName, (json: FirebaseConfig) => {
    const functionConfig = {
      codebase: options.projectName,
      source: joinPathFragments('dist', options.projectRoot),
      runtime: `nodejs${options.runTime}`,
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
    return json
  })
}
