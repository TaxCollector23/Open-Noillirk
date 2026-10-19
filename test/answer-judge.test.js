import test from "node:test";
import assert from "node:assert/strict";
import { aiConfigured, answerJudgeModel, judgeAnswer } from "../lib/answer-judge.js";
import { findPrompt } from "../lib/game-data.js";

const prompt = findPrompt("office-building");

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

test("without an OpenRouter key, an unrelated answer is rejected with retry guidance", async () => {
  const oldKey = process.env.OPENROUTER_API_KEY;
  const oldFetch = globalThis.fetch;
  let calls = 0;
  try {
    delete process.env.OPENROUTER_API_KEY;
    globalThis.fetch = async () => { calls += 1; throw new Error("must not call without a key"); };
    const result = await judgeAnswer(prompt, "pizza");
    assert.equal(aiConfigured(), false);
    assert.equal(calls, 0);
    assert.equal(result.accepted, false);
    assert.equal(result.retryable, true);
    assert.match(result.reason, /specific, on-topic/i);
  } finally {
    restoreEnv("OPENROUTER_API_KEY", oldKey);
    globalThis.fetch = oldFetch;
  }
});

test("the local fallback rejects a weak single-word overlap instead of guessing", async () => {
  const oldKey = process.env.OPENROUTER_API_KEY;
  const oldFetch = globalThis.fetch;
  let calls = 0;
  try {
    delete process.env.OPENROUTER_API_KEY;
    globalThis.fetch = async () => { calls += 1; throw new Error("must not call without a key"); };
    const result = await judgeAnswer(prompt, "basketball dish");
    assert.equal(result.accepted, false);
    assert.equal(result.retryable, true);
    assert.equal(calls, 0);
  } finally {
    restoreEnv("OPENROUTER_API_KEY", oldKey);
    globalThis.fetch = oldFetch;
  }
});

test("the free semantic judge accepts a plausible off-board answer at the lowest tier", async () => {
  const oldKey = process.env.OPENROUTER_API_KEY;
  const oldFetch = globalThis.fetch;
  let requestBody;
  try {
    process.env.OPENROUTER_API_KEY = "test-only-key";
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://openrouter.ai/api/v1/chat/completions");
      requestBody = JSON.parse(options.body);
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"related":true,"reason":"A weather vane can be on a rooftop."}' } }] }), { status: 200 });
    };
    const result = await judgeAnswer(prompt, "weather vane");
    assert.equal(requestBody.model, "google/gemma-3-4b-it:free");
    assert.deepEqual(requestBody.response_format, { type: "json_object" });
    assert.equal(requestBody.max_completion_tokens, 300);
    assert.deepEqual(JSON.parse(requestBody.messages[1].content), { prompt: prompt.text, category: prompt.cat, answer: "weather vane" });
    assert.equal(answerJudgeModel(), "google/gemma-3-4b-it:free");
    assert.equal(result.accepted, true);
    assert.equal(result.checkedBy, "ai");
    assert.equal(result.tier, "grounded");
    assert.equal(result.points, 4);
  } finally {
    restoreEnv("OPENROUTER_API_KEY", oldKey);
    globalThis.fetch = oldFetch;
  }
});

test("the semantic judge rejects unrelated answers without consuming the round", async () => {
  const oldKey = process.env.OPENROUTER_API_KEY;
  const oldFetch = globalThis.fetch;
  try {
    process.env.OPENROUTER_API_KEY = "test-only-key";
    globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: '{"related":false,"reason":"Unrelated."}' } }] }), { status: 200 });
    const result = await judgeAnswer(prompt, "pizza");
    assert.equal(result.accepted, false);
    assert.equal(result.retryable, true);
    assert.equal(result.checkedBy, "ai");
    assert.match(result.reason, /specific, on-topic/i);
  } finally {
    restoreEnv("OPENROUTER_API_KEY", oldKey);
    globalThis.fetch = oldFetch;
  }
});

test("known board answers use deterministic rank scoring without an AI call", async () => {
  const oldKey = process.env.OPENROUTER_API_KEY;
  const oldFetch = globalThis.fetch;
  let calls = 0;
  try {
    process.env.OPENROUTER_API_KEY = "test-only-key";
    globalThis.fetch = async () => { calls += 1; throw new Error("board answers should not call AI"); };
    const result = await judgeAnswer(prompt, "antenna");
    assert.equal(result.accepted, true);
    assert.equal(result.tier, "skyhigh");
    assert.equal(result.points, 100);
    assert.equal(calls, 0);
  } finally {
    restoreEnv("OPENROUTER_API_KEY", oldKey);
    globalThis.fetch = oldFetch;
  }
});
