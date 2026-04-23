/**
 * IconGlyph — thin wrapper around lucide-react icons.
 *
 * Provides a string-keyed map from design-handoff names to Lucide components
 * so screens can reference icons by name (`<IconGlyph name="flame" />`).
 * Any Lucide icon can also be passed directly via the `component` prop.
 *
 * Defaults: stroke 2, rounded linecaps and linejoins, 22px size, ink color.
 * When used decoratively, pass `decorative` to add aria-hidden="true".
 *
 * The ICON_MAP and IconName type are re-exported from iconMap.ts to keep
 * this file a pure component module (ESLint react-refresh compliance).
 */

import type { LucideProps, LucideIcon } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import { getGlassTokens } from '../../theme/liquidGlass'
import { ICON_MAP, type IconName } from './iconMap'

export { ICON_MAP, type IconName } from './iconMap'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface IconGlyphProps {
  /**
   * Handoff icon name. One of the 17 mapped names.
   * Either `name` or `component` must be provided.
   */
  readonly name?: IconName
  /**
   * Pass any Lucide icon component directly when the name map is insufficient.
   * Either `name` or `component` must be provided.
   */
  readonly component?: LucideIcon
  /** Icon size in px. Default 22. */
  readonly size?: number
  /** Stroke width. Default 2. */
  readonly stroke?: number
  /** Icon color. Defaults to the ink token for the current theme mode. */
  readonly color?: string
  /**
   * When true, adds aria-hidden="true" so screen readers skip the icon.
   * Use when the icon is decorative and a sibling label provides the meaning.
   */
  readonly decorative?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IconGlyph({
  name,
  component,
  size = 22,
  stroke = 2,
  color,
  decorative = false,
}: IconGlyphProps): React.JSX.Element {
  const theme = useTheme()
  const tokens = getGlassTokens(theme.palette.mode)

  const IconComponent: LucideIcon | undefined = component ?? (name ? ICON_MAP[name] : undefined)

  if (!IconComponent) {
    // Surface the gap at runtime in development — never silently swallow it.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[IconGlyph] No icon resolved — provide `name` or `component`.')
    }
    return <span aria-hidden="true" />
  }

  const iconProps: LucideProps = {
    size,
    strokeWidth: stroke,
    color: color ?? tokens.color.ink,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': decorative ? 'true' : undefined,
  }

  return <IconComponent {...iconProps} />
}
