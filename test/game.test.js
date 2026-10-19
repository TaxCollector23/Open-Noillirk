import test from "node:test";
import assert from "node:assert/strict";
import { chooseLineup, dayNumber, seededOrder } from "../lib/game.js";
import { findCorrection, findPrompt, scoreAnswer } from "../lib/game-data.js";
import { isDealTicketFor } from "../lib/tickets.js";

test("known board answers receive the expected tier", () => {
  const prompt = findPrompt("office-building");
  assert.equal(scoreAnswer(prompt, "satellite dish").tier, "jetstream");
  assert.equal(scoreAnswer(prompt, "antenna").points, 100);
});

test("unknown answers are not automatically accepted without a relevance check", () => {
  const prompt = findPrompt("office-building");
  const result = scoreAnswer(prompt, "a weather vane");
  assert.equal(result.accepted, false);
  assert.equal(result.retryable, true);
});

test("each answer rank maps to the reversed common-answer tiers", () => {
  const prompt = findPrompt("office-building");
  assert.equal(scoreAnswer(prompt, "antenna").tier, "skyhigh");
  assert.equal(scoreAnswer(prompt, "helipad").tier, "jetstream");
  assert.equal(scoreAnswer(prompt, "air conditioning").tier, "cloud");
  assert.equal(scoreAnswer(prompt, "solar panel").tier, "grounded");
});

test("a likely typo can be previewed without scoring it automatically", () => {
  const prompt = findPrompt("office-building");
  assert.equal(findCorrection(prompt, "satelltie dish"), "satellite dish");
  assert.equal(findCorrection(prompt, "satellite dish"), "satellite dish");
});

test("deal tickets are scoped to their prompt id", () => {
  assert.equal(isDealTicketFor("office-building.abc123", "office-building"), true);
  assert.equal(isDealTicketFor("breakfast-food.abc123", "office-building"), false);
  assert.equal(isDealTicketFor("office-building.", "office-building"), false);
});

test("lineups avoid recent prompts and stay at seven rounds", () => {
  const lineup = chooseLineup({ mode: "classic", day: "2026-10-18", recent: ["lost-at-home", "breakfast-food"] });
  assert.equal(lineup.length, 7);
  assert.equal(lineup.some((prompt) => prompt.id === "lost-at-home"), false);
});

test("daily lineup is the same for every player on the same UTC date", () => {
  const first = chooseLineup({ mode: "daily", day: "2026-10-18", recent: [] });
  const second = chooseLineup({ mode: "daily", day: "2026-10-18", recent: first.map((prompt) => prompt.id) });
  assert.deepEqual(second.map((prompt) => prompt.id), first.map((prompt) => prompt.id));
});

test("seeded ordering is reproducible", () => {
  assert.deepEqual(seededOrder(["a", "b", "c", "d"], "demo"), seededOrder(["a", "b", "c", "d"], "demo"));
});

test("daily numbering is anchored to the investigated era", () => {
  assert.equal(dayNumber("2026-09-27"), 1);
  assert.equal(dayNumber("2026-10-18"), 22);
});
