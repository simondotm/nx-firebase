import type { GeneratorCallback, Tree } from '@nrwl/devkit'
import { addDependenciesToPackageJson } from '@nrwl/devkit'
import {
  tsLibVersion,
  firebaseVersion,
  firebaseAdminVersion,
  firebaseFunctionsVersion,
  firebaseToolsVersion,
  firebaseFunctionsTestVersion,
} from '../../../utils/versions'

export function addDependencies(tree: Tree): GeneratorCallback {
  return addDependenciesToPackageJson(
    tree,
    {
      'firebase': firebaseVersion,
      'firebase-admin': firebaseAdminVersion,
      'firebase-functions': firebaseFunctionsVersion,
      tslib: tsLibVersion,
    },
    {
      'firebase-tools': firebaseToolsVersion,
      'firebase-functions-test': firebaseFunctionsTestVersion,
    },
  )
}
