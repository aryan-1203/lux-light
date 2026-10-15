import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import {
  colors,
  durations,
  easings,
  fontFamily,
  fontSize,
  hexToRgbChannels,
  radii,
  screens,
  shadows,
  spacing,
  toCssEasing,
  zIndex,
} from './src/design-system/tokens';

const colorVars = Object.fromEntries(
  Object.entries(colors).map(([name, hex]) => [`--color-${name}`, hexToRgbChannels(hex)]),
);

const themeColors = Object.fromEntries(
  Object.keys(colors).map((name) => [name, `rgb(var(--color-${name}) / <alpha-value>)`]),
);

const ms = (n: number) => `${n}ms`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    screens,
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      black: '#000000',
      white: '#FFFFFF',
      ...themeColors,
    },
    fontFamily,
    fontSize,
    borderRadius: radii,
    boxShadow: shadows,
    zIndex,
    extend: {
      spacing,
      maxWidth: {
        prose: '68ch',
        content: '80rem',
        narrow: '48rem',
      },
      minHeight: { touch: spacing.touch, 'screen-dvh': '100dvh' },
      minWidth: { touch: spacing.touch },
      height: { touch: spacing.touch, header: spacing.header },
      transitionDuration: Object.fromEntries(Object.entries(durations).map(([k, v]) => [k, ms(v)])),
      transitionTimingFunction: Object.fromEntries(
        Object.entries(easings).map(([k, v]) => [k, toCssEasing(v)]),
      ),
      backgroundImage: {
        'sunrise-gradient':
          'linear-gradient(135deg, rgb(var(--color-sunrise-deep)) 0%, rgb(var(--color-sunrise)) 45%, rgb(var(--color-daylight)) 100%)',
        'sunrise-radial':
          'radial-gradient(60% 60% at 50% 40%, rgb(var(--color-daylight) / 0.35) 0%, rgb(var(--color-sunrise) / 0.18) 35%, transparent 70%)',
        'horizon-fade': 'linear-gradient(180deg, transparent 0%, rgb(var(--color-bg)) 100%)',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        marquee: {
          '0%': { transform: 'translate3d(0,0,0)' },
          '100%': { transform: 'translate3d(-50%,0,0)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.75' },
          '50%': { opacity: '1' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        pop: {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '70%': { transform: 'scale(1.12)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        marquee: 'marquee var(--marquee-duration, 40s) linear infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        spin: 'spin 0.8s linear infinite',
        pop: `pop ${ms(durations.ui)} ${toCssEasing(easings.out)} both`,
        'fade-in': `fade-in ${ms(durations.ui)} ${toCssEasing(easings.out)} both`,
      },
    },
  },
  plugins: [
    plugin(({ addBase, addUtilities }) => {
      addBase({ ':root': colorVars });
      addUtilities({
        '.text-balance': { textWrap: 'balance' },
        '.text-pretty': { textWrap: 'pretty' },
        '.tabular-nums': { fontVariantNumeric: 'tabular-nums' },
        '.pb-safe': { paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' },
        '.pt-safe': { paddingTop: 'env(safe-area-inset-top)' },
        '.touch-manipulation': { touchAction: 'manipulation' },
      });
    }),
  ],
} satisfies Config;
