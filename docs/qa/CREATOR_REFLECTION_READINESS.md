# Photo and open-response missions — release preparation

The 2026-11-12 publication left 15 `photo1` and one `free` questions approved
because those formats were rejected by the publication endpoint and learner
catalog adapter. This change supports them without rewriting teacher content
as fabricated multiple-choice questions.

- The learner writes an observation and evidence (10–3,000 characters), then
  explicitly confirms that they have explained their reasoning. This is a
  participation check, never an automatic judgment of correctness.
- The reference answer and explanation appear after that action. The learner
  can save their own response as a local text file and move to the next mission.
  Response text is not transmitted or retained after closing the player.
- A required photograph must load before completion. Failed images show an
  explicit retry action. The native modal dialog contains keyboard focus and
  restores it on closing; external sources use the existing sandboxed viewer.
- School levels and optional English Challenge reference answers remain scoped
  by the author's metadata. Repeat practice cannot award duplicate completions.
- Bulk, Worker and legacy GAS publication accept the two formats. Admin role,
  explicit rights confirmation, media readiness and publication revocation
  checks remain in place. `web` is still unsupported.

Validation covers catalog normalization, self-check rules, English localization,
bulk eligibility and actual Worker publication/role/rights/media/revocation.
The QA entry is emitted only when `TP_QA_REFLECTION=1`; it uses a synthetic
question and has no connection to production records.

Release order: test the preview first, deploy the frontend, deploy the Worker,
then review the remaining 16 questions and publish suitable ones. No production
deployment or publication of those 16 is performed by preparing this change.
At least the historical wording of the Philippines graduation/tree-planting
question needs editorial checking: available primary sources describe bills,
not proof of the universal legal requirement asserted in its prompt.

## Verification — 2026-11-13 JST

- Full suite: 183 Node tests plus GAS, Worker integration and quick PIN checks pass.
- Standard production build and QA-only build pass; targeted player/helper lint passes.
- Protected Vercel preview `dpl_2iVG19U6ETgDGEWJPZMxLU3FJ6J1` is ready.
- Browser: photo and plain-text flows start disabled, accept a substantive answer
  with explicit self-check, then show the learner response, reference and explanation
  in the modal. Each submission increments the fixture once. Screenshot confirms
  the loaded image, explanation and footer controls fit the tested desktop viewport.
- This is browser verification, not a physical-iPad test. iPad keyboard/portrait
  and production release of the Worker remain separate release checks.
