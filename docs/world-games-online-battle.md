# Online Battle integration (disabled pilot)

The transport-independent state machine is src/utils/worldBattleRoom.js. It accepts only an authenticated actor ID, a validated action and server time. The pure engine is now wrapped by a separate pilot API and a client transport. There is no deployed service.

## Server integration requirements

- Create one independent room object per classroom. Use unpredictable room identifiers and separate host/participant session credentials; never accept an actor ID asserted by the client as authentication.
- Load the approved question catalog on the server; do not accept client-authored answer keys, and never return the raw room state or deck.
- Return only battleRoomView(room, authenticatedActor). Before reveal, answer keys, explanations and other teams' answer choices are omitted.
- Serialize mutations per room. Host commands use an exact revision; team submissions use round/question identity, so independent team answers are accepted even when submitted simultaneously.
- The host starts and reveals questions. The server rejects late or duplicate answers. Use deadline timestamps rather than per-second network messages.
- Add idempotent reconnect, room expiration, rate limits, authenticated session storage, origin restrictions, privacy controls and a load test before enabling live play. Do not collect student names by default.
- The pilot transport and classroom UI are implemented but disabled by default. Local games remain usable without a network connection.

## Candidate architecture

Cloudflare Durable Objects / WebSocket hibernation, subject to account limits and verification. Keep large assets and static content cached; send state transitions only. Test concurrent rooms and enforce budget/rate limits before releasing. No new paid services or production deployments are authorized by this change.

## Pilot API (2026-11-26)

- Separate Worker: `cloudflare/timepalette-battle-api`, default disabled, no workers.dev route. SQLite Durable Object per eight-character hexadecimal room code.
- Teacher creation is protected by a runtime secret of at least 32 characters and an explicit origin allowlist. Never put the creation secret in Vite environment variables or client code.
- Each team receives a separate 192-bit random invitation/bearer token. The room stores only SHA-256 token digests; the teacher must distribute invitations privately. The room code is not a credential.
- POST /rooms creates a room from country/category/language filters, loading the approved game catalog on the server. No client-provided answer keys.
- POST /rooms/:code/join, /view, /action, /close use Authorization: Bearer <token>. Joining again with the same token resumes the team; close is host-only.
- Server-side time, revision/round checks, private answer views, serialized state changes and a four-hour fixed expiration. Rooms can also be deleted explicitly by the host.
- Browser adapter: `src/utils/worldGameOnlineClient.js`. Polling callers should cancel obsolete requests and ignore stale revisions; the UI polls every 1.5 seconds (5 seconds when hidden), with a timeout, and ignores obsolete revisions. WebSockets are not implemented.
- CI runs pure room service tests and a Worker syntax check. Actual Workers runtime/bundling, multi-device/browser testing, QR invitation distribution, durable storage/alarm behavior, traffic rate limiting and budget checks are still required.
- Do not enable or deploy until these checks are complete. No changes to the existing Mission Creator Worker or existing database.


### Teacher and team UI

Set the public API endpoint via VITE_WORLD_BATTLE_API_URL **only in a controlled test build**. The online entry in World Quiz Battle is absent when this variable is unset. The teacher uses the existing country/category/language/team settings and enters the runtime creation key. Team invitations are individually revealed/copied in a collapsed panel, not projected by default. Teams join with the room code and their own token. The host controls start/reveal/next/close, and the team screen confirms submitted answers. Re-enter the same invitation after refresh; secrets are not persisted in browser storage. The teacher must keep the screen open or safely retain credentials; host recovery after refresh is not yet implemented.

Browser QA uses three independent contexts and the actual pure room-service reducer behind a mocked HTTP adapter. It checks private answer views, synchronized scoring, final results, closure and viewport overflow. It is not a deployed Worker integration or load test. QR sharing and production release remain pending.
