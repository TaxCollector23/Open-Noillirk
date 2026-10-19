import { CLASSIC_ROUNDS, PROMPTS, ROUND_SECONDS } from "./game-data.js";

export function hashSeed(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededOrder(items, seed) {
  const result = [...items];
  let state = hashSeed(seed) || 1;
  for (let i = result.length - 1; i > 0; i -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function chooseLineup({ mode = "classic", day = new Date().toISOString().slice(0, 10), recent = [] } = {}) {
  const recentSet = new Set(mode === "daily" ? [] : recent);
  const seed = mode === "daily" ? `daily:${day}` : `${mode}:${Date.now()}:${Math.random()}`;
  const candidates = seededOrder(PROMPTS, seed);
  const fresh = candidates.filter((prompt) => !recentSet.has(prompt.id));
  if (mode === "endless") return [fresh[0] ?? candidates[0]];
  return [...fresh, ...candidates].filter((prompt, index, all) => all.findIndex((item) => item.id === prompt.id) === index).slice(0, CLASSIC_ROUNDS);
}

export function dayNumber(day) {
  const epoch = Date.UTC(2026, 8, 27);
  return Math.floor((Date.parse(`${day}T00:00:00Z`) - epoch) / 86400000) + 1;
}

export { ROUND_SECONDS };
