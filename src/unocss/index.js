import * as colors from './colors.js'
import { semanticShortcuts } from './semantic.js'

export const fontSize = {
  lg: ['var(--font-size-lg)', 'var(--line-height-lg)'],
  md: ['var(--font-size-md)', 'var(--line-height-md)'],
  sm: ['var(--font-size-sm)', 'var(--line-height-sm)'],
  xs: ['var(--font-size-xs)', 'var(--line-height-xs)'],
}

export const fontWeight = {
  extrabold: '700',
  bold: '680',
  semibold: '600',
  medium: '550',
  regular: '485',
}

export const lineHeight = {
  lg: 'var(--line-height-lg)',
  md: 'var(--line-height-md)',
  sm: 'var(--line-height-sm)',
  xs: 'var(--line-height-xs)',
}

export const letterSpacing = {
  none: '0',
}

export const typographyShortcuts = [{
  'text-h1': 'text-[length:var(--font-size-h1)] line-height-[var(--line-height-h1)] font-extrabold',
  'text-h2': 'text-[length:var(--font-size-h2)] line-height-[var(--line-height-h2)] font-bold',
  'text-h3': 'text-[length:var(--font-size-h3)] line-height-[var(--line-height-h3)] font-bold',
  'text-h4': 'text-[length:var(--font-size-h4)] line-height-[var(--line-height-h4)] font-bold',
  'text-subtitle1': 'text-[length:var(--font-size-subtitle1)] line-height-[var(--line-height-subtitle1)] font-semibold',
  'text-subtitle2': 'text-[length:var(--font-size-subtitle2)] line-height-[var(--line-height-subtitle2)] font-semibold',
  'text-body-lg': 'text-[length:var(--font-size-lg)] line-height-[var(--line-height-lg)] font-regular',
  'text-body-sm': 'text-[length:var(--font-size-sm)] line-height-[var(--line-height-sm)] font-regular',
  'text-body-sm-medium': 'text-[length:var(--font-size-sm)] line-height-[var(--line-height-sm)] font-medium',
  'text-body-xs': 'text-[length:var(--font-size-xs)] line-height-[var(--line-height-xs)] font-regular',
}]

export const breakpoints = {
  tablet: '768px',
  desktop: '1024px',
}

export const uiTheme = {
  colors,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  zIndex: {
    banner: '1000',
    'banner-alert': '1001',
    toast: '2000',
  },
}

export const uiExtendTheme = (theme) => ({
  ...theme,
  breakpoints: {
    ...(theme?.breakpoints ?? {}),
    ...breakpoints,
  },
})

export const uiShortcuts = [
  ...typographyShortcuts,
  ...semanticShortcuts,
]
