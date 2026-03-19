import { LocalStorageService } from './LocalStorageService'
import type { StorageService } from './StorageService'

export type { StorageService } from './StorageService'
export { LocalStorageService } from './LocalStorageService'

let instance: StorageService | null = null

/**
 * Returns a singleton StorageService instance.
 * For MVP this is always LocalStorageService; can be swapped later based on config/env.
 */
export function getStorageService(): StorageService {
  if (instance === null) {
    instance = new LocalStorageService()
  }
  return instance
}
