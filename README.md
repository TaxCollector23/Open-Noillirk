# Open Noillirk

Open Noillirk is a free, independent survey-climb game. It pairs the MIT-licensed client interface and visual assets from [OpenKrillion](https://github.com/VulcanEon/openkrillion.com-service) with Noillirk-inspired rules and an independently maintained prompt/answer service. It is not affiliated with either reference game's operators.

The original Noillirk site was inspected with [REA](https://github.com/morluto/rea). The evidence supports the visible game loop and API shape, not the private implementation or the source survey data. This project therefore uses an editable prompt bank in `lib/game-data.js`, not copied Noillirk answers.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Checks:

```bash
npm test
npm run build
```

## How it is built

- `app/` is the Next.js App Router shell and Vercel API routes.
- `public/app.mjs`, `public/ocean.mjs`, and the other browser modules power the adapted OpenKrillion interface and game scene.
- `public/noillirk-adapter.mjs` translates the browser game contract into Noillirk API calls and stores in-progress runs locally.
- `lib/game-data.js` owns prompt boards and rank-to-tier scoring; `lib/answer-judge.js` handles off-board answer relevance.
- `docs/architecture.md` describes request flow, state ownership, limitations, and the evidence boundary.

## API

| Route | Purpose |
| --- | --- |
| `POST /api/noillirk/deal` | Deals a Daily, Classic, or Endless prompt set with per-prompt request markers. |
| `POST /api/noillirk/answer` | Checks an answer against the board, then optionally judges off-board relevance. |
| `GET /api/noillirk/answers?promptId=…&ticket=…` | Returns the dealt prompt's public answer board for review. |
| `GET /api/health` | Deployment and optional AI-configuration check. |

The shorter `/api/deal`, `/api/answer`, and `/api/answers` routes are compatibility aliases.

## Optional semantic answer review

Without configuration, off-board answers use a conservative local relevance check: unrelated or unclear text is rejected with a retry prompt rather than automatically earning points. To allow semantic review of plausible off-board answers, set `OPENROUTER_API_KEY` in the Vercel project's server-side environment. The default model is `openrouter/free`; the key is never exposed to the browser. If the provider is unavailable, the local check is used. The game remains playable without a key. See `.env.example` for optional settings.

## Honest limitations

- There are no accounts, database, analytics, or cross-device sync. Run progress, settings, and history live in the current browser's local storage.
- Local Party is same-device pass-and-play, not online multiplayer. Vercel Functions are stateless; cross-device rooms need a realtime transport and shared persistence.
- Only answer validation and board access run on the server. The timer and run continuity are client-owned, so this is not a competitive anti-cheat service.
- The project does not ingest the reference site's survey dataset or sync with `krillion.io`.

## License and attribution

Open Noillirk's original code is MIT-licensed. Reused OpenKrillion source and assets remain under the upstream MIT license in `third_party/openkrillion/LICENSE`; the VT323 font has its bundled SIL Open Font License. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
