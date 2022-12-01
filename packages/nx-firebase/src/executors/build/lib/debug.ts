import { logger } from '@nrwl/devkit'

const ENABLE_DEBUG = false
export function debugLog(...args) {
  if (ENABLE_DEBUG) {
    logger.log(args)
  }
}
