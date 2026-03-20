/**
 * BottomNav - mobile-style bottom navigation bar.
 *
 * Renders five navigation tabs: Home, Quiz, Words, Stats, Settings.
 * On desktop viewports the bar still renders at the bottom to keep
 * the mobile-first experience consistent; it could be promoted to a
 * sidebar variant in a future enhancement.
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
          />
        ))}
      </BottomNavigation>
    </Paper>
  )
}
