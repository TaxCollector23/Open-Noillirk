import test from "node:test";
import assert from "node:assert/strict";
import { chooseLineup, dayNumber, seededOrder } from "../lib/game.js";
import { findPrompt, scoreAnswer } from "../lib/game-data.js";

test("known board answers receive the expected tier", () => {
  const prompt = findPrompt("office-building");
  assert.equal(scoreAnswer(prompt, "satellite dish").tier, "jetstream");
  assert.equal(scoreAnswer(prompt, "antenna").points, 100);
});

test("unknown readable answers remain accepted at the grounded tier", () => {
  const prompt = findPrompt("office-building");
  const result = scoreAnswer(prompt, "a weather vane");
  assert.equal(result.accepted, true);
  assert.equal(result.tier, "grounded");
  assert.equal(result.points, 4);
});

test("lineups avoid recent prompts and stay at seven rounds", () => {
  const lineup = chooseLineup({ mode: "classic", day: "2026-10-18", recent: ["lost-at-home", "breakfast-food"] });
  assert.equal(lineup.length, 7);
  assert.equal(lineup.some((prompt) => prompt.id === "lost-at-home"), false);
});

test("seeded ordering is reproducible", () => {
  assert.deepEqual(seededOrder(["a", "b", "c", "d"], "demo"), seededOrder(["a", "b", "c", "d"], "demo"));
});

test("daily numbering is anchored to the investigated era", () => {
  assert.equal(dayNumber("2026-09-27"), 1);
  assert.equal(dayNumber("2026-10-18"), 22);
});
