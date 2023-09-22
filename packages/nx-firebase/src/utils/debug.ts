import { logger } from '@nx/devkit'

// debug info just for plugin
const ENABLE_DEBUG_INFO = false

export function debugInfo(info: string) {
  if (ENABLE_DEBUG_INFO) {
    logger.info(info)
  }
}

export function mapKeys<T, R>(map: Map<T, R>) {
  return JSON.stringify([...map.keys()], null, 3)
}

export function mapValues<T, R>(map: Map<T, R>) {
  return JSON.stringify([...map.values()], null, 3)
}

export function mapEntries<T, R>(map: Map<T, R>) {
  return JSON.stringify([...map.entries()], null, 3)
}
