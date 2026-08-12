/**
 * Dark-only palette, aligned with the web app (zinc palette + status colors).
 */

export const Colors = {
  background: '#09090B',
  card: '#18181B',
  cardAlt: '#212225',
  border: '#27272A',
  text: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  accent: '#3B82F6',
  accentText: '#60A5FA',
  rating: '#FBBF24',
  danger: '#F87171',
  emerald: '#34D399',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;