export const TIERS = {
  grounded: { name: 'Grounded', score: 4, emoji: '🌱', color: '#8fa3c4', blurb: 'A valid answer, just not a common one. Keep climbing.' },
  treetop: { name: 'Treetop', score: 8, emoji: '🍃', color: '#ff9f43', blurb: 'A few people thought of that.' },
  kite: { name: 'Kite', score: 16, emoji: '🪁', color: '#4de3ff', blurb: 'A nice lift above the canopy.' },
  cloud: { name: 'Cloud Nine', score: 32, emoji: '☁️', color: '#79dd9a', blurb: 'A popular answer. Up you go.' },
  jetstream: { name: 'Jet Stream', score: 64, emoji: '✈️', color: '#ff6e88', blurb: 'One of the crowd favourites.' },
  skyhigh: { name: 'Sky High', score: 100, emoji: '🌟', color: '#ffd166', blurb: 'The most common answer. Straight to the top.' },
  miss: { name: 'No Lift', score: 0, emoji: '⬛', color: '#7d93b8', blurb: 'No accepted answer this round.' },
};

export const BANDS = [
  { min: 0, max: 59, tier: 'grounded', name: 'Grounded', text: 'Every climb starts at the forest floor.' },
  { min: 60, max: 111, tier: 'treetop', name: 'Treetop', text: 'A few answers caught the breeze.' },
  { min: 112, max: 223, tier: 'kite', name: 'Kite', text: 'You are rising above the canopy.' },
  { min: 224, max: 447, tier: 'cloud', name: 'Cloud Nine', text: 'The crowd is giving you lift.' },
  { min: 448, max: 599, tier: 'jetstream', name: 'Jet Stream', text: 'You found the popular answers.' },
  { min: 600, max: 700, tier: 'skyhigh', name: 'Sky High', text: 'A remarkably common-answer climb.' },
];

export const ROUND_MS = 15_000;
export const PREVIEW_MS = 3_000;
export const ROUNDS = 7;
export const bandFor = score => [...BANDS].reverse().find(b => score >= b.min) || BANDS[0];
export const normalize = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
export function etDate(now = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
}
export function resetAt(date) {
  return Date.parse(`${date}T00:00:00Z`) + 86_400_000;
}
export function distance(a, b, limit = Infinity) {
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    if (Math.min(...next) > limit) return limit + 1;
    row = next;
  }
  return row[b.length];
}
export function matchAnswer(input, answers) {
  const key = normalize(input);
  if (!key || key.length > 256) return null;
  const entries = answers.flatMap(a => [a.answer, ...(a.aliases || [])].map(word => ({ word, a, key: normalize(word) })));
  const exact = entries.find(e => e.key === key);
  if (exact) return { ...exact.a, correction: false };
  const allowance = key.length < 5 ? 0 : key.length < 9 ? 1 : 2;
  const candidates = entries.map(e => ({ ...e, d: distance(key, e.key, allowance) })).filter(e => e.d <= allowance).sort((a, b) => a.d - b.d);
  if (candidates.length && (!candidates[1] || candidates[0].d < candidates[1].d || candidates[0].a.answer === candidates[1].a.answer)) return { ...candidates[0].a, correction: true };
  return null;
}
export function shareText(day, results) {
  const score = results.reduce((s, r) => s + r.score, 0);
  const emoji = { grounded: '🟦', treetop: '🟧', kite: '🪁', cloud: '☁️', jetstream: '🛩️', skyhigh: '🌟', miss: '⬛' };
  return `Open Noillirk #${day} 🎈\n${score}/700 · +${score * 10}m\n${results.map(r => emoji[r.tier] || '⬛').join('')}\nhttps://open-noillirk.vercel.app`;
}
