import type { ProjectData } from './test-utils-project-data'






const IMPORT_MATCH = `import * as logger from "firebase-functions/logger";`

export function getMainTs() {
  return `
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onRequest} from "firebase-functions/v2/https";
${IMPORT_MATCH}

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});
`
}


/**
 * return the import function for a generated library
 */
export function getLibImport(projectData: ProjectData) {
  // convert kebab-case project name to camelCase library import
  const libName = projectData.projectName.split('-').map((part, index) => index > 0 ? part[0].toUpperCase() + part.substring(1) : part).join('')
  return libName
}

export function addImport(mainTs: string, addition: string) {
  const replaced = mainTs.replace(IMPORT_MATCH, `${IMPORT_MATCH}\n${addition}`)
  return replaced
}






