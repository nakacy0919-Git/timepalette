最新追記（2026-10-27）：[A110問受入記録](qa/A_110_ACCEPTANCE.md)。Aの教材・ローカル操作440ケース合格。B17か国は未受入のため公開対象外。写真原本28点を同梱し、実Chrome外部読み込み証拠を記録。都市42点と地形・模式ルートを照合。本番公開・Creator銀行公開の結果は別途記録。以下は前回時点の履歴。

# TimePalette Geography Work Handoff

Updated: 2026-10-26 JST
Status: A/B shared implementation exists; content acceptance and production publication are NOT complete.

Working branch: `work/geography-creator-live-round1-20261026`
Base: `feat/timepalette-creator-voice-20261022` at `6d6c61c74b236411a2d89785abe72c5b9fee5627`, identified in Vercel production history. The old main was 28 commits behind this base.

The originally requested `work/timepalette-ab-qa-20261025-220703` was not present on GitHub. Its Windows-only changes were not available. This branch contains a fresh A/B country-driven implementation based on the Rwanda game's ten activity types, not an imported local snapshot.

Read [the implementation and release notes](TIMEPALETTE_ROUND1_IMPLEMENTATION.md) and [the country/mission QA matrix](qa/ROUND1_QA_MATRIX.md) before editing.

- A: 11 countries × 10 missions; B: 17 × 10. New country profiles and shared renderer are under `src/data/geography` and `src/components/world-learning/place-v1`.
- Legacy `missions_*.json` are removed; the four Creator categories have no legacy fallback. Geography and time remain dedicated adventures.
- Existing Cloudflare, video, voice and learning-level behavior is retained from the production source.
- Country structure, scoring, image metadata, live-image browser loads, local image rendering, pedagogy and source review are separate checks. Do not equate build/structural/browser-operation passes with content completion.
- `npm run qa:release` currently blocks because country content reviews are pending.
- No new C/D or later country packages have been generated.
- No main merge, production deployment, live question status update, D1 migration or R2 mutation was performed.
- Production inspection via a temporary Vercel share-access link was rejected by automatic approval review. Do not change protection or use an indirect route to work around that rejection. Explicit authorization for that access or a supported normal authenticated session is needed.

Complete A's factual/pedagogical and real iPad acceptance before moving the validated quality standard to later countries. Keep fixes and reports on an isolated work branch.
