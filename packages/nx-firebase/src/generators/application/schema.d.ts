import { Linter } from '@nx/linter'
import { UnitTestRunner } from '../../utils/test-runners'

export interface ApplicationGeneratorOptions {
  // standard @nx/node:app options
  name: string
  directory?: string
  frontendProject?: string
  linter?: Linter
  skipFormat?: boolean
  skipPackageJson?: boolean
  standaloneConfig?: boolean
  tags?: string
  unitTestRunner?: UnitTestRunner
  setParserOptionsProject?: boolean
  // extra options for @simondotm/nx-firebase:app generator
  project?: string
}

interface NormalizedOptions extends ApplicationGeneratorOptions {
  projectRoot: Path
  projectName: string
  firebaseConfigName: string
}
