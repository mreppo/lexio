/**
 * Shared component barrel.
 *
 * BottomNav has been replaced by <TabBar> from './composites'.
 * AppContent.tsx imports TabBar and AppTab directly from composites.
 * No BottomNav alias is re-exported here — the composites barrel is the
 * canonical source of truth for TabBar.
 */
export { UpdateNotification } from './UpdateNotification'
export { BrandedLoader } from './BrandedLoader'
export { TabTransition } from './TabTransition'
export { InstallBanner } from './InstallBanner'
export { IosInstallInstructions } from './IosInstallInstructions'
