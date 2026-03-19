import { createContext, useContext } from 'react'
import { getStorageService } from '@/services/storage'
import type { StorageService } from '@/services/storage'

/**
 * React Context for dependency-injecting the StorageService.
 * Defaults to the singleton from getStorageService() so wrapping in a provider
 * is optional - only needed for testing or swapping implementations.
 */
export const StorageContext = createContext<StorageService>(getStorageService())

/**
 * Hook to access the StorageService instance from React components.
 *
 * Usage:
 *   const storage = useStorage()
 *   const pairs = await storage.getLanguagePairs()
 */
export function useStorage(): StorageService {
  return useContext(StorageContext)
}
