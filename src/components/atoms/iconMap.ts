/**
 * Icon map — handoff names → lucide-react components.
 *
 * Split into its own module so the ESLint react-refresh rule is not triggered
 * by mixing constant exports with component exports in IconGlyph.tsx.
 */

import type { LucideIcon } from 'lucide-react'
import {
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Flame,
  Check,
  Volume2,
  Search,
  BookOpen,
  Layers,
  Sparkles,
  Clock,
  Zap,
  Settings,
  Trophy,
  Bell,
  Share,
  Pencil,
  CheckSquare,
} from 'lucide-react'

/** All handoff icon names mapped to their Lucide equivalents. */
export const ICON_MAP = {
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  close: X,
  x: X,
  plus: Plus,
  flame: Flame,
  check: Check,
  speaker: Volume2,
  search: Search,
  book: BookOpen,
  card: Layers,
  sparkle: Sparkles,
  clock: Clock,
  flash: Zap,
  settings: Settings,
  trophy: Trophy,
  bell: Bell,
  share: Share,
  /** Typing quiz mode icon — spec name "Pencil" */
  pencil: Pencil,
  /** Multiple choice quiz mode icon — spec name "CheckSquare" */
  checkSquare: CheckSquare,
} as const satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICON_MAP
