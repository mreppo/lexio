/**
 * BottomNav - mobile-style bottom navigation bar.
 *
 * Renders five navigation tabs: Home, Quiz, Words, Stats, Settings.
 * On desktop viewports the bar still renders at the bottom to keep
 * the mobile-first experience consistent; it could be promoted to a
 * sidebar variant in a future enhancement.
 *
 * Visual polish:
 * - Active tab icon scales up with a spring-like transition
 * - Colour transitions are smooth on tap
 * All animations respect `prefers-reduced-motion`.
 */

import { Paper, BottomNavigation, BottomNavigationAction } from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import QuizIcon from '@mui/icons-material/Quiz'
import ListIcon from '@mui/icons-material/List'
import BarChartIcon from '@mui/icons-material/BarChart'
import SettingsIcon from '@mui/icons-material/Settings'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppTab = 'home' | 'quiz' | 'words' | 'stats' | 'settings'

export interface BottomNavProps {
  /** The currently active tab. */
  readonly activeTab: AppTab
  /** Called when the user selects a different tab. */
  readonly onTabChange: (tab: AppTab) => void
}

// ─── Tab descriptors ──────────────────────────────────────────────────────────

interface TabDescriptor {
  readonly value: AppTab
  readonly label: string
  readonly icon: React.ReactNode
}

const TABS: readonly TabDescriptor[] = [
  { value: 'home', label: 'Home', icon: <HomeIcon /> },
  { value: 'quiz', label: 'Quiz', icon: <QuizIcon /> },
  { value: 'words', label: 'Words', icon: <ListIcon /> },
  { value: 'stats', label: 'Stats', icon: <BarChartIcon /> },
  { value: 'settings', label: 'Settings', icon: <SettingsIcon /> },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <Paper
      elevation={3}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        // Ensure bottom nav does not overlap system home indicator on iOS.
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        value={activeTab}
        onChange={(_e, newValue: AppTab) => {
          onTabChange(newValue)
        }}
        showLabels
        component="nav"
        aria-label="App navigation"
      >
        {TABS.map(({ value, label, icon }) => (
          <BottomNavigationAction
            key={value}
            label={label}
            value={value}
            icon={icon}
            aria-label={`Navigate to ${label}`}
            sx={{
              // Smooth colour transition on active state change.
              transition: 'color 0.2s ease',
              '& .MuiBottomNavigationAction-label': {
                transition: 'font-size 0.2s ease, opacity 0.2s ease',
              },
              // Active icon scales up with a spring-like overshoot.
              '&.Mui-selected': {
                '& svg': {
                  transform: 'scale(1.15)',
                  transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                },
              },
              '& svg': {
                transition: 'transform 0.2s ease',
              },
              // Disable all transitions when reduced motion is preferred.
              '@media (prefers-reduced-motion: reduce)': {
                transition: 'none',
                '& .MuiBottomNavigationAction-label': { transition: 'none' },
                '&.Mui-selected': {
                  '& svg': { transform: 'none', transition: 'none' },
                },
                '& svg': { transition: 'none' },
              },
            }}
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
