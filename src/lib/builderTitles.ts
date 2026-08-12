/**
 * Builder titles written in HH Goa's voice — terse, declarative, a little cocky.
 * Reference points from their own copy: "Less Noise. More Signal.",
 * "heads down. ship or ship", "4 days. one rhythm. everything intentional."
 * Deliberately avoids badge clichés (no ninjas, rockstars, gurus, wizards).
 */

interface TitleCategory {
  /** lowercase keywords matched against the user's stack/role input */
  match: string[];
  titles: string[];
}

const CATEGORIES: TitleCategory[] = [
  {
    match: ['front', 'react', 'vue', 'svelte', 'next', 'ui engineer', 'web dev', 'javascript', 'typescript', 'css', 'html'],
    titles: [
      'MAKES IT FEEL RIGHT',
      'INTERFACE SURGEON',
      'RENDERS UNDER PRESSURE',
      'PIXELS WITH INTENT',
      'SHIPS THE LAST 10%',
      'CSS IS MY PASSION',
      'DOM DESTROYER',
      '60FPS OR NOTHING',
      'REACT HOOK ARCHITECT',
      'PX PERFECT PURIST',
    ],
  },
  {
    match: ['back', 'api', 'server', 'node', 'go', 'rust', 'java', 'python', 'django', 'rails', 'database', 'sql', 'postgres', 'mongo'],
    titles: [
      'KEEPS THE LIGHTS ON',
      'HANDLES THE LOAD',
      'P99 OBSESSIVE',
      'BUILDS THE PLUMBING',
      'FAILS GRACEFULLY',
      'DATABASE SURGEON',
      'MEMORY LEAK SURVIVOR',
      'ASYNC & UNBOTHERED',
      'RAW SQL DEMON',
      'OUT OF MEMORY SURVIVOR',
    ],
  },
  {
    match: ['ai', 'ml', 'machine learning', 'llm', 'data scien', 'nlp', 'vision', 'model', 'pytorch', 'tensor', 'vibe', 'prompt'],
    titles: [
      'PROMPTS WITH INTENT',
      'EVAL-DRIVEN',
      'TRAINS ON CAFFEINE',
      'GRADIENT DESCENDER',
      'READS THE WEIGHTS',
      'HALLUCINATES IN PRODUCTION',
      'CONTEXT WINDOW OVERFLOW',
      'FINE-TUNED & UNBOTHERED',
      'LLM WHISPERER',
      'RAW TOKEN CONSUMER',
    ],
  },
  {
    match: ['design', 'ux', 'ui/ux', 'product design', 'brand', 'figma', 'visual', 'creative', 'art'],
    titles: [
      'MAKES IT OBVIOUS',
      'KERNS IN PUBLIC',
      'TASTE, DOCUMENTED',
      'DEFENDS THE WHITESPACE',
      'CUTS THE CLUTTER',
      'FIGMA TERRORIST',
      'PIXEL POLICE',
      'ZERO REDESIGN FEAR',
    ],
  },
  {
    match: ['full', 'stack', 'generalist', 'indie', 'solo', 'vibe coder'],
    titles: [
      'DOES THE WHOLE STACK',
      'NO HANDOFFS NEEDED',
      'FRONT TO BACK, SOLO',
      'OWNS IT END TO END',
      'SHIPS WITHOUT ASKING',
      'VIBE CODING AT 4AM',
      'ONE MAN ARMY',
      'COPY PASTE ARCHITECT',
    ],
  },
  {
    match: ['devops', 'infra', 'sre', 'platform', 'cloud', 'kubernetes', 'k8s', 'docker', 'aws', 'sysadmin'],
    titles: [
      'DEPLOYS ON FRIDAY',
      'GREEN BUILDS ONLY',
      'YAML ARCHAEOLOGIST',
      'PAGES NOBODY AT 3AM',
      'AUTOMATES THE BORING',
      'SUDO RM -RF SURVIVOR',
      'KUBERNETES WRANGLER',
      'TERRAFORM DESTROYER',
    ],
  },
  {
    match: ['mobile', 'ios', 'android', 'flutter', 'swift', 'kotlin', 'react native', 'app'],
    titles: [
      'SHIPS TO BOTH STORES',
      'THUMB-ZONE NATIVE',
      'SURVIVES APP REVIEW',
      'BUILDS FOR ONE HAND',
      '60FPS OR NOTHING',
      'SWIFT WHISPERER',
    ],
  },
  {
    match: ['web3', 'blockchain', 'solidity', 'crypto', 'onchain', 'smart contract', 'defi', 'solana', 'eth'],
    titles: [
      'AUDITS TWICE',
      'ONCHAIN NATIVE',
      'TRUSTS THE BYTECODE',
      'IMMUTABLE BY DEFAULT',
      'READS EVERY LINE',
      'GAS FEE OPTIMIZER',
      'MEV BOT SLAYER',
      'ZERO KNOWLEDGE DRINKER',
    ],
  },
  {
    match: ['security', 'infosec', 'pentest', 'appsec', 'hacker', 'red team', 'cybersec'],
    titles: [
      'BREAKS IT FIRST',
      'THINKS IN THREAT MODELS',
      'TRUSTS NOTHING',
      'FINDS THE EDGE CASE',
      'PATCHES BEFORE DAWN',
      'ZERO DAY DISCOVERER',
      'ROOT PRIVILEGE GRANTED',
    ],
  },
  {
    match: ['data', 'analytics', 'pipeline', 'etl', 'warehouse', 'bi', 'data engine'],
    titles: [
      'QUERIES AT SCALE',
      'PIPELINE PLUMBER',
      'CLEANS THE DATA',
      'TRUSTS THE NUMBERS',
      'JOINS WITHOUT FEAR',
      'PETABYTE PIPELINER',
    ],
  },
  {
    match: ['founder', 'product', 'pm', 'growth', 'bd', 'marketing', 'ops', 'ceo'],
    titles: [
      'SHIPS, THEN ASKS',
      'TALKS TO USERS',
      'SCOPE ASSASSIN',
      'KILLS THE ROADMAP',
      'SELLS WHAT SHIPS',
      'PIVOTS WEEKLY',
      'BURN RATE CHAMPION',
    ],
  },
];

/** Used for everyone — the house voice, applies regardless of stack. */
const UNIVERSAL: string[] = [
  'SIGNAL OVER NOISE',
  'HEADS DOWN, SHIPPING',
  'TERMINAL RESIDENT',
  'BUILT FOR THE 247',
  'SHIPS OR SHIPS',
  'COMMITS UNDER PRESSURE',
  'ONE RHYTHM, NO FLUFF',
  'HERE TO BUILD, NOT NETWORK',
  'TESTS IN PRODUCTION',
  'STACK OVERFLOW LEGEND',
  'RESTART SOLVES ALL',
  'NO COMMIT MESSAGES',
  'SHIP FIRST ASK LATER',
  'CAFFEINE TO CODE 1:1',
];

/** Small deterministic string hash so the same inputs always give the same title. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function poolFor(role: string): string[] {
  const r = role.toLowerCase().trim();
  const matched = CATEGORIES.filter((c) => c.match.some((k) => r.includes(k)));
  if (matched.length === 0) return UNIVERSAL;
  // Category titles are weighted 2:1 over universal ones so the title reads
  // specific to what they actually build, while still sounding like the house.
  const specific = matched.flatMap((c) => c.titles);
  return [...specific, ...specific, ...UNIVERSAL];
}

/**
 * Picks a builder title. Deterministic for a given (name, role, reroll) triple,
 * so re-rendering the card never silently changes the title.
 */
export function pickBuilderTitle(name: string, role: string, reroll = 0): string {
  const pool = poolFor(role);
  return pool[hash(`${name}|${role}|${reroll}`) % pool.length];
}

/** Per-builder pass number, stable for a given name, in the spirit of "The Road to 247". */
export function makeSerial(name: string): string {
  const n = (hash(`serial|${name}`) % 247) + 1;
  return String(n).padStart(3, '0');
}
