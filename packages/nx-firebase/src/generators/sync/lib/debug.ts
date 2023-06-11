import { logger } from '@nx/devkit'

const ENABLE_DEBUG_INFO = true

export function debugInfo(info: string) {
  if (ENABLE_DEBUG_INFO) {
    logger.info(info)
  }
}

export function mapKeys(map: Map<any, any>) {
  return JSON.stringify([...map.keys()], null, 3)
}

export function mapValues(map: Map<any, any>) {
  return JSON.stringify([...map.values()], null, 3)
}

export function mapEntries(map: Map<any, any>) {
  return JSON.stringify([...map.entries()], null, 3)
}
