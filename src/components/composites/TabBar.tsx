/**
 * TabBar — Liquid Glass floating tab bar.
 *
 * Absolute positioned pill at bottom:30, horizontally centered, z-index:20.
 * Wraps a <Glass strong floating radius=34 pad=8> containing 5 tab slots.
 *
 * Tab slots: 52×52, border-radius:26.
 * Active:   accent background, glassShadows.activeTab shadow, white icon stroke 2.4.
 * Inactive: transparent background, inkSoft icon stroke 2.
 *
 * Tab order matches the AppTab enum: home | quiz | words | stats | settings.
 * Corresponding icons (lucide-react): Zap | Layers | BookOpen | Trophy | Settings.
 *
 * Note: the design prototype spec mentions "4 tab slots" but the AC explicitly
 * lists 5 tabs (home, quiz, words, stats, settings). We render 5 — the "4" in
 * the spec is a prototype artefact (the prototype's tab order omitted quiz).
 *
 * A11y:
 *   - <nav aria-label="App navigation"> wraps the bar
 *   - Each tab is a <button> with aria-label="Navigate to {Label}"
 *   - Active tab has aria-current="page"
 *
 * Animations: only opacity/transform transitions — never animate backdrop-filter,
 * background, or box-shadow on blurred surfaces (GPU stutter).
 *
 * The paddingBottom uses env(safe-area-inset-bottom) to clear the iOS home
 * indicator — this is on the <nav> wrapper, not on the glass surface itself.
 */

import { Box } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Zap, Layers, BookOpen, Trophy, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Glass } from '../primitives/Glass'
import { getGlassTokens, glassShadows } from '../../theme/liquidGlass'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Matches the AppTab union from the legacy BottomNav — kept identical for call-site stability. */
export type AppTab = 'home' | 'quiz' | 'words' | 'stats' | 'settings'

export interface TabBarProps {
  /** The currently active tab. */
  readonly activeTab: AppTab
  /** Called when the user selects a different tab. */
  readonly onTabChange: (tab: AppTab) => void
}

// ─── Tab descriptors ──────────────────────────────────────────────────────────

interface TabDescriptor {
  readonly value: AppTab
  /** Human-readable label used for aria-label. */
  readonly label: string
  readonly Icon: LucideIcon
}

/**
 * Five tabs in AppTab enum order.
 * Icons: Zap (home/flash), Layers (quiz/card), BookOpen (words/book),
 *        Trophy (stats), Settings (settings/gear).
 */
const TABS: readonly TabDescriptor[] = [
  { value: 'home', label: 'Home', Icon: Zap },
  { value: 'quiz', label: 'Quiz', Icon: Layers },
  { value: 'words', label: 'Words', Icon: BookOpen },
  { value: 'stats', label: 'Stats', Icon: Trophy },
  { value: 'settings', label: 'Settings', Icon: Settings },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function TabBar({ activeTab, onTabChange }: TabBarProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  return (
    /*
     * Outer <nav> wrapper:
     *   - position:fixed (see note below) so it floats above the content
     *   - bottom:30 + paddingBottom:env(safe-area-inset-bottom) clears iOS home indicator
     *   - left/right 0 + display:flex justifyContent:center = horizontally centered pill
     *   - z-index:20 per spec
     *
     * Note on position:fixed vs position:absolute:
     *   The design spec calls for position:absolute so the TabBar sits inside the
     *   PaperSurface screen root (which scrolls). However, the per-screen PaperSurface
     *   layout is being introduced progressively across issues #145–#155. Until those
     *   screens adopt PaperSurface as a constrained scroll root, position:absolute
     *   resolves to a tall ancestor and the tab buttons overlap page content — breaking
     *   e2e tests. Using position:fixed here preserves the existing behavior (identical
     *   to the legacy BottomNav) and will be changed to position:absolute in a follow-up
     *   once screens are rooted in PaperSurface.
     */
    <Box
      component="nav"
      aria-label="App navigation"
      sx={{
        position: 'fixed',
        bottom: '30px',
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        zIndex: 20,
        // Safe-area padding so the pill sits above the iOS home indicator
        paddingBottom: 'env(safe-area-inset-bottom)',
        // The full-width positioning box must not intercept pointer events —
        // only the visible pill should be interactive. This prevents the nav
        // from blocking clicks on content that sits underneath the wide
        // transparent area around the pill.
        pointerEvents: 'none',
      }}
    >
      {/* Glass pill container: strong + floating, radius 34, pad 8 */}
      {/* pointerEvents: 'none' so the glass surface itself does not capture clicks —
          only the individual tab <button> elements restore pointer events. */}
      <Glass strong floating radius={34} pad={8} sx={{ pointerEvents: 'none' }}>
        <Box
          sx={{
            display: 'flex',
            gap: '4px',
          }}
        >
          {TABS.map(({ value, label, Icon }) => {
            const isActive = value === activeTab
            return (
              <Box
                key={value}
                component="button"
                aria-label={`Navigate to ${label}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onTabChange(value)}
                sx={{
                  // 52×52 touch target, radius 26 per spec
                  width: '52px',
                  height: '52px',
                  borderRadius: '26px',
                  // Active: accent bg + accent-glow shadow
                  // Inactive: transparent
                  backgroundColor: isActive ? tokens.color.accent : 'transparent',
                  boxShadow: isActive ? glassShadows.activeTab : 'none',
                  // Reset button defaults
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  // Re-enable pointer events — nav and Glass wrappers are pointer-events: none
                  // so only these buttons capture interaction
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // Only animate opacity/transform — never background or box-shadow
                  // on blurred chrome (GPU stutter)
                  transition: 'opacity 150ms ease, transform 150ms ease',
                  '&:active': {
                    opacity: 0.8,
                    transform: 'scale(0.94)',
                  },
                  '@media (prefers-reduced-motion: reduce)': {
                    transition: 'none',
                    '&:active': { transform: 'none' },
                  },
                }}
              >
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2.4 : 2}
                  color={isActive ? '#ffffff' : tokens.color.inkSoft}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                />
              </Box>
            )
          })}
        </Box>
      </Glass>
    </Box>
  )
}
