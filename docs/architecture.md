# Open Noillirk architecture and review

## Evidence boundary

The public [Noillirk page](https://playdaily.org/noillirk) was inspected with [REA](https://github.com/morluto/rea), including its visible runtime and selected shipped browser chunks. Observed behavior includes Daily/Classic/Endless modes, seven 15-second rounds, rank-based common-answer scoring, six ascent tiers, and an Endless balloon loop. Its browser bundles reference deal, answer, answer-board, spread, and room-transport contracts. Static REA evidence ID: `ev_6286445269052bce3c2fae9b3f0bf4d2aa17dcd6f5f36ecbe2cd99f4db92e90d`.

This is evidence of the browser-facing contract, not access to Noillirk's private server code, database, corpus, or every runtime path. Open Noillirk therefore recreates the observed game loop and owns a separate, readable prompt bank; it does not claim to expose or reproduce the private backend dataset. The room transport's existence was observed, but its provider's wire protocol and full semantics were not reverse-engineered.

## Components and request flow

```text
Next.js page (`app/page.jsx`)
  └─ OpenKrillion-derived browser shell and game modules (`public/`)
       └─ `public/noillirk-adapter.mjs`
            ├─ POST /api/noillirk/deal      → `lib/game.js` lineup + per-prompt request markers
            ├─ POST /api/noillirk/answer    → exact board scoring, then relevance judge
            │                                  ├─ OpenRouter free route (optional server key)
            │                                  └─ conservative lexical fallback
            └─ GET /api/noillirk/answers    → public board, guarded by the matching deal ticket
```

`app/api/noillirk/*` are route aliases into the shorter `/api/*` implementations. Vercel hosts the Next.js API handlers. `lib/game-data.js` is the source of truth for the independently assembled prompt and answer corpus, canonical aliases, rank-to-tier conversion, and correction suggestions. `lib/answer-judge.js` is the boundary for off-board semantic relevance; the model does not choose points or ranks.

## Answer acceptance and retry behavior

1. Normalize and check the answer against the prompt's canonical board and aliases. Exact accepted answers get their rank's fixed tier.
2. For a valid-length off-board answer, call OpenRouter only if `OPENROUTER_API_KEY` is configured. The model is asked only whether it is on-topic; it cannot choose the score. Unrelated answers return a retryable rejection and the interface asks for a more specific, on-topic answer without consuming the round.
3. If no key is configured, the call fails, or its response is malformed, the local lexical fallback checks for topic/board overlap and rejects unmatched text. This is deliberately conservative and can reject a plausible answer it cannot relate to the sample corpus; the prompt remains editable, the user can retry, and setting the optional key improves semantic coverage.
4. If an answer is related but not on the board, it can receive the lowest accepted tier (Grounded). Typo corrections are only previews; the player must confirm before scoring.

The Vercel deployment currently has no OpenRouter key. It remains playable with the local fallback. To enable semantic judging in production, add `OPENROUTER_API_KEY` as a Vercel server-side environment variable and redeploy. `.env.example` documents the setting. Never use a `NEXT_PUBLIC_` key.

## State, trust, and limitations

| State / operation | Owner | Notes |
| --- | --- | --- |
| Prompt bank, board rank, scoring | Server source in `lib/game-data.js` | Editable static corpus; no database. |
| Deal lineup and board access | Vercel API | A request marker rejects a marker paired with a different prompt ID, but it is not signed or checked against server session state; it does not prevent answer-board scraping. It is not identity, authorization, or anti-cheat. |
| Answer verdict | Vercel API | Server checks exact board entries; off-board relevance is AI-optional. |
| Timer, run continuation, recent prompts | Browser local storage / client | Client-owned and resettable; not trusted competitive state. |
| Settings, scores, logbook, feedback notes | Browser local storage | No account or cross-device sync. Feedback is saved locally, not submitted to a service. |
| Local Party | One browser/device | Pass-and-play after each round; room code does not connect devices. |

The original reference's multiplayer transport and spread endpoint are not implemented as online services here. Cross-device multiplayer requires a separate real-time transport and durable shared state; the UI should not imply otherwise. Browser-owned timing also means users can alter local game state, so scores are for personal play, not verified competition.

## Interface lineage and licensing

The OpenKrillion repository at [VulcanEon/openkrillion.com-service](https://github.com/VulcanEon/openkrillion.com-service) is MIT-licensed. Open Noillirk adapts its browser client, canvas scene, synthesized audio, styling, and pixel assets; local glue, Noillirk rules, answer data, and server routes connect that interface to the distinct Noillirk game contract. The copied source subset and original MIT license are preserved under `third_party/openkrillion/`. VT323 has its own SIL Open Font License bundled beside the font. Root `LICENSE` and `THIRD_PARTY_NOTICES.md` explain the project and upstream terms.

No Krillion service worker, Cloudflare/D1/R2 backend, account service, analytics pipeline, or external puzzle data is included. The visual and gameplay contract is intentionally adapted where rules differ: Noillirk's 15-second timer and common-answer ascent remain authoritative.
