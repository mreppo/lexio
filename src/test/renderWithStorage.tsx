/**
 * Shared render helpers that wrap components and hooks in StorageContext.Provider.
 *
 * Usage:
 *   const storage = createMockStorage({ getWords: vi.fn().mockResolvedValue([word]) })
 *   renderWithStorage(<MyComponent />, storage)
 *
 *   const { result } = renderHookWithStorage(() => useMyHook(), storage)
 */

import { createElement, type ReactElement } from 'react'
import type { ReactNode } from 'react'
import { render, renderHook } from '@testing-library/react'
import type { RenderResult, RenderHookResult } from '@testing-library/react'
import { StorageContext } from '@/hooks/useStorage'
import type { StorageService } from '@/services/storage/StorageService'
import { createMockStorage } from './mockStorage'

function makeWrapper(storage: StorageService) {
  return ({ children }: { children: ReactNode }) =>
    createElement(StorageContext.Provider, { value: storage }, children)
}

export function renderWithStorage(
  ui: ReactElement,
  storage: StorageService = createMockStorage(),
): RenderResult {
  return render(ui, { wrapper: makeWrapper(storage) })
}

export function renderHookWithStorage<T>(
  hook: () => T,
  storage: StorageService = createMockStorage(),
): RenderHookResult<T, unknown> {
  return renderHook(hook, { wrapper: makeWrapper(storage) })
}
