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

export interface ThemePreset {
  id: 'forest' | 'sunrise' | 'cyber' | 'vintage';
  name: string;
  emoji: string;
  primary: string;
  accent: string;
  pink: string;
  offwhite: string;
  bg: string;
}

export const THEMES: Record<string, ThemePreset> = {
  forest: {
    id: 'forest',
    name: 'Deep Forest',
    emoji: '🌲',
    primary: '#0B6839',
    accent: '#FEE101',
    pink: '#FF0080',
    offwhite: '#FFFBE8',
    bg: '#0B6839',
  },
  sunrise: {
    id: 'sunrise',
    name: 'Goa Sunrise',
    emoji: '🌅',
    primary: '#9A3412',
    accent: '#FDE047',
    pink: '#FB7185',
    offwhite: '#FFF7ED',
    bg: '#7C2D12',
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Neon',
    emoji: '⚡',
    primary: '#18181B',
    accent: '#22D3EE',
    pink: '#F43F5E',
    offwhite: '#F4F4F5',
    bg: '#09090B',
  },
  vintage: {
    id: 'vintage',
    name: 'Vintage Riso',
    emoji: '📄',
    primary: '#27272A',
    accent: '#FACC15',
    pink: '#E11D48',
    offwhite: '#FEF08A',
    bg: '#18181B',
  },
};

export const STICKERS = [
  { id: 'SHIP OR SHIP', text: '⚡ SHIP OR SHIP' },
  { id: 'LESS NOISE', text: '🎯 LESS NOISE' },
  { id: 'GOA 2026', text: '🌴 GOA 2026' },
  { id: '10X BUILDER', text: '🔥 10X BUILDER' },
  { id: 'PROMPT & SHIP', text: '🤖 PROMPT & SHIP' },
  { id: 'LATE NIGHT', text: '🌙 3AM COMMIT' },
  { id: 'PALM & CODE', text: '🌊 PALM & CODE' },
  { id: 'PROMPT WHISPERER', text: '🧠 PROMPT WHISPERER' },
  { id: 'CAFFEINE TO CODE', text: '☕ CAFFEINE TO CODE' },
  { id: 'SHIP OR DIE', text: '⚡ SHIP OR DIE' },
  { id: 'GOA VIP 247', text: '🌴 GOA VIP 247' },
  { id: 'NO SLEEP SQUAD', text: '🚀 NO SLEEP SQUAD' },
  { id: 'BUG HUNTER', text: '🛠️ BUG HUNTER' },
  { id: 'LLM WRANGLER', text: '🤖 LLM WRANGLER' },
  { id: 'DEPLOYS ON FRIDAY', text: '💀 DEPLOYS ON FRIDAY' },
  { id: 'VIBE CODER', text: '🔮 VIBE CODER' },
  { id: 'SURF & SCRIPT', text: '🌊 SURF & SCRIPT' },
  { id: 'SPICY COMMITS', text: '🌶️ SPICY COMMITS' },
  { id: 'GOD MODE', text: '🏆 GOD MODE' },
] as const;

