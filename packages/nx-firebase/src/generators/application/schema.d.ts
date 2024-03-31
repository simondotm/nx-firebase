import { ProjectNameAndRootFormat } from "@nx/devkit/src/generators/project-name-and-root-utils";

export interface Schema {
  // standard @nx project generator options
  name: string
  directory?: string
  tags?: string
  projectNameAndRootFormat?: ProjectNameAndRootFormat;  
  rootProject?: boolean;
  // extra options for @simondotm/nx-firebase:app generator
  project?: string
  // firebaseProject?: string
  // firebaseConfig?: string
}

export interface NormalizedSchema extends Schema {
  projectName: string
  projectRoot: string
  parsedTags: string[];
  firebaseConfigName: string
}
