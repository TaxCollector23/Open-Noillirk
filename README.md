# Open Noillirk

Open Noillirk is an independent, open-source survey-climb game. It is a clean-room reconstruction of the interaction model observed on [playdaily.org/noillirk](https://playdaily.org/noillirk): choose a climb, answer timed prompts, reveal a survey tier, and turn points into altitude.

The project is intentionally self-contained:

- Next.js App Router with small JSON API routes.
- An original editable prompt/answer corpus in `lib/game-data.js`.
- Deterministic local scoring with six visible tiers.
- Daily, Classic, Endless, results, best-score storage, and a same-browser local room mode.
- No paid AI provider or required API key.
- Original CSS/pixel-inspired visuals; no assets copied from the reference site.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm test
npm run build
```

## API surface

| Route | Purpose |
| --- | --- |
| `POST /api/noillirk/deal` | Returns a Classic/Daily lineup or the next Endless prompt. |
| `POST /api/noillirk/answer` | Scores one answer against the open board. |
| `GET /api/noillirk/answers?prompt=...` | Returns the public answer board for a prompt. |
| `GET /api/health` | Deployment smoke check. |

The shorter `/api/deal`, `/api/answer`, and `/api/answers` paths remain as local aliases.

## Scope note

The original site has a durable multiplayer transport. Vercel Functions are stateless, so this repository ships a transparent same-browser pass-and-play room instead of claiming cross-device realtime without a storage/realtime provider. The adapter seam is documented in [docs/architecture.md](docs/architecture.md); adding a free realtime backend later does not require changing the scoring or UI contract.

## Attribution and investigation notes

The reference behavior was inspected from the public page and its shipped browser bundles using [REA](https://github.com/morluto/rea), an MIT-licensed reverse-engineering toolkit. The implementation here is new code and new visual styling. See the architecture document for observed behavior, evidence boundaries, and deliberate differences.
