const RUN_KEY = 'noillirk:active-run';
const PARTY_KEY = 'noillirk:party';
const NOTES_KEY = 'noillirk:local-feedback';
const ROUND_MS = 15_000;
const PREVIEW_MS = 3_000;

const clone = value => JSON.parse(JSON.stringify(value));
function read(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing may disable storage. */ }
}
async function post(path, data) {
  const response = await fetch(path, { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'The signal is lost. Please retry.');
  return body;
}
function runId() {
  return `noillirk-${globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`}`;
}
function save(game) {
  write(RUN_KEY, game);
  return clone(game);
}
function getRun(id) {
  const game = read(RUN_KEY);
  if (!game || (id && game.runId !== id)) throw new Error('This climb is no longer saved on this device. Start a new climb.');
  return game;
}
function makeGame(mode, deal) {
  const prompts = mode === 'endless' ? [deal.prompt].filter(Boolean) : deal.prompts || [];
  if (!prompts.length) throw new Error('No prompts were returned. Please try again.');
  const date = deal.day || new Date().toISOString().slice(0, 10);
  const partyMode = read('noillirk:party-next', false);
  write('noillirk:party-next', false);
  return save({
    runId: runId(), date, dayNumber: deal.number ?? 0, mode, prompts, tickets: deal.tickets || { [prompts[0].id]: deal.ticket },
    results: [], round: 0, roundStart: Date.now() + PREVIEW_MS, completed: false, pausedAt: null, resetsAt: Date.parse(`${date}T00:00:00Z`) + 86_400_000,
    oxygen: 3, misses: 0, players: partyMode ? read(PARTY_KEY)?.players || [] : [],
  });
}
function addResult(game, answerResult, rawAnswer) {
  const prompt = game.prompts[game.round];
  const tier = answerResult?.accepted ? answerResult.tier : 'miss';
  const score = answerResult?.accepted ? Number(answerResult.points) || 0 : 0;
  const result = {
    round: game.round, score, tier, answer: answerResult?.accepted ? answerResult.answer : '', rawAnswer: rawAnswer || '',
    quip: answerResult?.reason || '', promptId: prompt.id,
    player: game.players.length ? game.players[game.results.length % game.players.length] : null,
  };
  game.results.push(result);
  game.roundStart = null;
  if (game.mode === 'endless') {
    if (tier === 'miss') { game.misses += 1; game.oxygen = Math.max(0, game.oxygen - 1); }
    if (tier === 'skyhigh') game.oxygen = Math.min(3, game.oxygen + 1);
    game.completed = game.oxygen <= 0 || game.results.length >= 70;
  } else {
    game.completed = game.round >= game.prompts.length - 1;
  }
  return result;
}

export async function noillirkApi(path, data) {
  if (path === 'today') {
    const deal = await post('/api/noillirk/deal', { mode: 'daily' });
    return { date: deal.day, dayNumber: deal.number, sample: false };
  }

  if (path === 'start') {
    const requested = data?.mode || (data?.practice ? 'classic' : 'daily');
    const mode = requested === 'practice' ? 'classic' : requested;
    if (!['daily', 'classic', 'endless'].includes(mode)) throw new Error('Choose Daily, Classic, or Endless.');
    const recent = read('noillirk:recent', []);
    const deal = await post('/api/noillirk/deal', { mode, recent });
    return makeGame(mode, deal);
  }

  if (path.startsWith('state?run=')) {
    const id = new URLSearchParams(path.split('?')[1]).get('run');
    return clone(getRun(id));
  }

  if (path === 'pause') {
    const game = getRun(data?.runId);
    if (data.paused && !game.pausedAt) game.pausedAt = Date.now();
    if (!data.paused && game.pausedAt) {
      if (game.roundStart) game.roundStart += Date.now() - game.pausedAt;
      game.pausedAt = null;
    }
    return save(game);
  }

  if (path === 'answer') {
    const game = getRun(data?.runId);
    if (game.completed || game.round !== data.round || game.roundStart === null) throw new Error('This prompt is no longer active.');
    const prompt = game.prompts[game.round];
    const raw = String(data.answer || '').trim();
    if (data.timeout || !raw) {
      const result = addResult(game, null, '');
      return { result, state: save(game) };
    }
    const answerResult = await post('/api/noillirk/answer', {
      promptId: prompt.id, ticket: game.tickets[prompt.id], answer: raw,
      previewCorrection: Boolean(data.previewCorrection), confirm: Boolean(data.confirm),
    });
    if (answerResult.correction) return { correction: answerResult.correction };
    if (!answerResult.accepted && answerResult.retryable) return { rejected: true, message: answerResult.reason || 'That does not fit the prompt. Try a more specific answer.' };
    const result = addResult(game, answerResult, raw);
    return { result, state: save(game) };
  }

  if (path === 'next') {
    const game = getRun(data?.runId);
    if (game.completed) return clone(game);
    const nextRound = game.round + 1;
    if (game.mode === 'endless' && nextRound >= game.prompts.length) {
      const recent = game.results.map(result => result.promptId);
      const deal = await post('/api/noillirk/deal', { mode: 'endless', recent });
      if (!deal.prompt) throw new Error('No next prompt was returned.');
      game.prompts.push(deal.prompt);
      game.tickets[deal.prompt.id] = deal.ticket;
    }
    if (nextRound >= game.prompts.length) {
      game.completed = true;
      return save(game);
    }
    game.round = nextRound;
    game.roundStart = Date.now() + PREVIEW_MS;
    return save(game);
  }

  if (path.startsWith('review?run=')) {
    const id = new URLSearchParams(path.split('?')[1]).get('run');
    const game = getRun(id);
    const prompts = await Promise.all(game.prompts.slice(0, game.results.length).map(async prompt => {
      try {
        const query = new URLSearchParams({ promptId: prompt.id, ticket: game.tickets[prompt.id] || '' });
        const response = await fetch(`/api/noillirk/answers?${query}`, { credentials: 'same-origin', cache: 'no-store' });
        const board = await response.json();
        return { answers: (board.answers || []).map(answer => ({ ...answer, score: answer.points, quip: '' })) };
      } catch { return { answers: [] }; }
    }));
    return { betterThan: null, dist: [], population: 0, prompts };
  }

  if (path === 'feedback') {
    const notes = read(NOTES_KEY, []);
    notes.push({ kind: data.kind, text: String(data.text || '').slice(0, 1000), savedAt: new Date().toISOString() });
    write(NOTES_KEY, notes.slice(-50));
    return { savedLocally: true };
  }

  throw new Error(`Unsupported game request: ${path}`);
}
