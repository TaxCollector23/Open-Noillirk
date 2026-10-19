# Open Noillirk architecture

## What was observed

The public Noillirk page is a Next.js client/server application. Runtime observation showed:

1. A menu with Daily, Classic, Endless, sound, a begin button, and a multiplayer entry point.
2. Classic starts with a short countdown, then seven prompts with a 15-second clock.
3. A prompt has one text answer, Pass, and Climb controls.
4. An accepted answer reveals one of six tiers: Grounded, Treetop, Kite, Cloud Nine, Jet Stream, or Sky High. Points are 4, 8, 16, 32, 64, and 100; the climb converts points at 10 metres per point.
5. Endless starts with three balloons. A miss removes one; a Sky High result restores one. It continues until oxygen reaches zero or the world cap is reached.
6. Daily/Classic progress and best scores are kept in browser storage.

The shipped bundle statically references these same-origin contracts:

- `POST /api/noillirk/deal` for prompt lineups/tickets.
- `POST /api/noillirk/answer` for a verdict.
- `GET /api/noillirk/answers?prompt=...&ticket=...` for the answer board.
- `/api/noillirk/spread` for the scrolling world animation.
- A room transport configured as a 30-player `noillirk-arena` channel.

Static REA analysis was run against the two selected game chunks from the captured page. Evidence ID: `ev_6286445269052bce3c2fae9b3f0bf4d2aa17dcd6f5f36ecbe2cd99f4db92e90d`. This is static evidence; it does not prove server internals or every runtime path.

## Open Noillirk design

```text
Browser UI (app/page.jsx)
        │
        ├── /api/deal      → lineup selection (lib/game.js)
        ├── /api/answer    → explicit board scoring (lib/game-data.js)
        ├── /api/answers   → public board inspection
        └── /api/health    → deployment smoke check
```

The prompt corpus is deliberately local and readable. The server does not call an LLM, so there is no OpenRouter key, moderation dependency, or opaque answer judgment in the default deployment. Unknown non-empty text answers are accepted as Grounded; known aliases map into the visible board tiers.

## Persistence and multiplayer

Single-player progress is client-side by design: best scores, recent prompt IDs, and the selected mode are stored in local storage. The local room screen makes the hosting boundary explicit. It is a same-browser room/pass-and-play surface, not a cross-device websocket service.

To add durable realtime later, implement a `RoomTransport` with these operations:

```ts
type RoomTransport = {
  createRoom(): Promise<{ code: string }>;
  joinRoom(code: string, name: string): Promise<RoomState>;
  send(event: RoomEvent): Promise<void>;
  subscribe(listener: (event: RoomEvent) => void): () => void;
};
```

The UI and answer scoring should remain unchanged. A free provider can be connected through environment variables without putting secrets in the browser.

## Deliberate differences

- Visuals are original CSS/pixel-inspired layers rather than copied canvas art or fonts.
- The prompt corpus is original and smaller than the reference site's corpus.
- There is no ad stack, analytics, account system, or third-party consent UI.
- The default game is fully playable without an API key.
