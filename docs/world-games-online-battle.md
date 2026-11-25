# Online Battle integration (prototype)

The transport-independent state machine is src/utils/worldBattleRoom.js. It accepts only an authenticated actor ID, a validated action and server time. It does not implement sockets, room codes, authentication or a deployed service.

## Server integration requirements

- Create one independent room object per classroom. Use unpredictable room identifiers and separate host/participant session credentials; never accept an actor ID asserted by the client as authentication.
- Load the approved question catalog on the server; do not accept client-authored answer keys, and never return the raw room state or deck.
- Return only battleRoomView(room, authenticatedActor). Before reveal, answer keys, explanations and other teams' answer choices are omitted.
- Serialize mutations per room. Host commands use an exact revision; team submissions use round/question identity, so independent team answers are accepted even when submitted simultaneously.
- The host starts and reveals questions. The server rejects late or duplicate answers. Use deadline timestamps rather than per-second network messages.
- Add idempotent reconnect, room expiration, rate limits, authenticated session storage, origin restrictions, privacy controls and a load test before enabling live play. Do not collect student names by default.
- No online transport is configured in this branch; the local game remains usable without a realtime connection.

## Candidate architecture

Cloudflare Durable Objects / WebSocket hibernation, subject to account limits and verification. Keep large assets and static content cached; send state transitions only. Test concurrent rooms and enforce budget/rate limits before releasing. No new paid services or production deployments are authorized by this change.
