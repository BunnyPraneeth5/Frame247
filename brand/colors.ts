// Verified 2026-08-11 directly from hhgoa.com's compiled Tailwind CSS
// (.bg-brand-primary, .bg-brand-accent, .bg-brand-pink, .bg-brand-offwhite, .text-brand-white)
// — not approximated from screenshots.

export const colors = {
  primary: '#0B6839', // deep forest green — main surface / background
  accent: '#FEE101', // bright yellow — wordmark, CTAs, badges, eyebrow labels
  pink: '#FF0080', // hot pink/magenta — गोवा badge outline, callouts, roadmap accents
  offwhite: '#FFFBE8', // warm cream — light section backgrounds, card surfaces
  white: '#FFFFFF', // pure white — text on green/pink surfaces
  black: '#000000', // video section bg, high-contrast accents
} as const;

export type BrandColor = keyof typeof colors;
