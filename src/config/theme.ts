/**
 * VeloBike Theme Configuration
 * 
 * Color Palette: Lục (60-30-10 rule)
 * - White/Light (60%): Nền chủ đạo
 * - Forest Green (30%): Nhận diện thương hiệu
 * - Mustard Gold (10%): Điểm nhấn CTA
 */
import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// =============================================================================
// COLORS
// =============================================================================
export const COLORS = {
  // Primary - Forest Green (30%)
  primary: '#2D6A4F',
  primaryLight: '#52B788',
  primaryDark: '#1B4332',
  primarySurface: '#D8F3DC',
  primaryMuted: '#95D5B2',

  // Accent - Mustard Gold (10%)
  accent: '#D4A017',
  accentLight: '#FFF3CD',
  accentDark: '#B8860B',
  accentSurface: '#FEF9E7',

  // Neutrals - White & Gray (60%)
  white: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#F8FAF9',
  surfaceSecondary: '#F0F2F1',
  card: '#FFFFFF',

  // Text
  text: '#1A1C1E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#3D2E00',

  // Border & Divider
  border: '#E8ECEF',
  borderLight: '#F0F2F5',
  divider: '#E5E7EB',

  // Semantic
  success: '#16A34A',
  error: '#DC2626',
  errorLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',

  // Specific use
  star: '#F59E0B',
  badge: '#D4A017',
  skeleton: '#E5E7EB',

  // Transparent
  transparent: 'transparent',
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================
export const FONTS = {
  // Font families - system defaults (cross-platform)
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }) as string,
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }) as string,
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }) as string,
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
} as const;

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

// Predefined text styles
export const TEXT_STYLES = {
  h1: {
    fontSize: FONT_SIZES['3xl'],
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES['3xl'] * LINE_HEIGHTS.tight,
    color: COLORS.text,
  },
  h2: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES['2xl'] * LINE_HEIGHTS.tight,
    color: COLORS.text,
  },
  h3: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.xl * LINE_HEIGHTS.tight,
    color: COLORS.text,
  },
  h4: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.lg * LINE_HEIGHTS.tight,
    color: COLORS.text,
  },
  body: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
    color: COLORS.text,
  },
  bodySmall: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.normal,
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
    color: COLORS.textLight,
  },
  button: {
    fontSize: FONT_SIZES.base,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.tight,
  },
  buttonSmall: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.tight,
  },
  label: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    lineHeight: FONT_SIZES.md * LINE_HEIGHTS.normal,
    color: COLORS.text,
  },
} as const;

// =============================================================================
// SPACING
// =============================================================================
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

// =============================================================================
// SHADOWS
// =============================================================================
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// =============================================================================
// ANIMATION
// =============================================================================
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: {
    tension: 50,
    friction: 7,
  },
  springBouncy: {
    tension: 100,
    friction: 6,
  },
  springGentle: {
    tension: 40,
    friction: 8,
  },
} as const;

// =============================================================================
// LAYOUT
// =============================================================================
export const LAYOUT = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  hitSlop: { top: 8, right: 8, bottom: 8, left: 8 },
  tabBarHeight: 64,
  headerHeight: 56,
  bottomInset: Platform.OS === 'ios' ? 34 : 0,
  horizontalPadding: SPACING.base,
} as const;

// =============================================================================
// ICON SIZES
// =============================================================================
export const ICON_SIZES = {
  xs: 14,
  sm: 16,
  md: 20,
  base: 24,
  lg: 28,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
} as const;

export default {
  COLORS,
  FONTS,
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  TEXT_STYLES,
  SPACING,
  RADIUS,
  SHADOWS,
  ANIMATION,
  LAYOUT,
  ICON_SIZES,
};
