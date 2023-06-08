import { logger } from '@nx/devkit'

const ENABLE_DEBUG_INFO = false

export function debugInfo(info: string) {
  if (ENABLE_DEBUG_INFO) {
    logger.info(info)
  }
}
