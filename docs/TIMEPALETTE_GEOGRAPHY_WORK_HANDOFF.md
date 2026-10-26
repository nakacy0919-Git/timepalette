# TimePalette Geography — GPT Work Handoff and Acceptance Plan
Last updated: 2026-10-26 JST
Repository: nakacy0919-Git/timepalette
Status: HANDOFF PREPARED. LOCAL DEVELOPMENT SNAPSHOT NOT YET TRANSFERRED.

## Critical provenance notice
This handoff branch was created directly from GitHub main, because the local branch
`work/timepalette-ab-qa-20261025-220703` was not present on GitHub at check time.
The following files and QA improvements were previously reported on the developer's Windows
working tree at `C:\Users\nakac\timepalette-terminal-b` and have NOT been
verified as present on this remote branch. Do not assume this branch contains
the latest A/B geography implementation. A sanitized source snapshot is required to
reconcile local changes before modifying or deploying production.

## Product objective
Build 197 countries x 10 geography missions = 1,970 interactive learning missions.
Finish and verify **A group first** (11 countries x 10 = 110 missions), before scaling
the validated architecture and content standards to B–Z. Do not mass-generate C–Z
until A is approved. Maintain the original Rwanda-style interactive game rather
than replacing it with static multiple-choice quizzes.

## A group — expected 11 countries (ISO2)
- af Afghanistan
- al Albania
- dz Algeria
- ad Andorra
- ao Angola
- ag Antigua and Barbuda
- ar Argentina
- am Armenia
- au Australia
- at Austria
- az Azerbaijan

## Reported local-only QA status (from previous user-provided terminal logs)
- Vite build succeeded.
- Geography QA reported A/B 28 countries, 0 errors, 0 warnings after correcting
  atlas aliases for Antigua and Barbuda and Bosnia and Herzegovina.
- Image Guard checked 29 countries, 290 missions, 377 image references,
  with 0 missing, 0 unknown after repairs.
- The Playwright smoke test was under revision (v1.3) because P10 automated map checks
  were inconsistent with the actual world-atlas data.
- Rwanda iPad layout scrolling warnings remained.
- Some past issues included hardcoded Kigali capital checks, Australia P10 map framing,
  duplicate silhouettes in B group P03, unavailable Commons file names, and P06–P10
  vertical overflow.
All these are **reported historical results**, not fresh verification against
the GitHub source or a passing full browser automation suite.

## Development constraints
- Work on isolated feature branches and open PRs for review.
- Do not merge to main or deploy production without explicit approval.
- Keep ongoing Mission Creator, timezone, and other teams' work intact.
- No database migrations, Cloudflare D1/R2 writes or live progress updates until authorized.
- Prefer reusable country-driven components instead of maintaining per-country 90KB
  React files where feasible, but preserve observable behavior during refactors.

## Acceptance checks for EACH of the 110 A-group missions
1. **Data and map**: correct ISO2, name, region, full country shape, neighbors and
   directional relationships; city/capital name and coordinates grounded in sources.
2. **Photos**: Commons asset exists, loads in the rendered browser, is the intended
   location/content, and has recorded license/source attribution. Existence alone
   does not prove content suitability.
3. **Interaction**: test a correct action and at least one plausible incorrect action.
   Correct clears the mission; incorrect does not, no blocked buttons.
4. **P01–P10 coverage**: world locator, neighbors, silhouette, capital, city,
   landscape photos, life photo evidence, route/port, photo evidence, three-key
   final mastery (all sub-steps).
5. **Tablet UI**: on 1024x768 landscape and 820x1180 portrait, no
   whole-page scrolling to reach primary question, photos or answer controls;
   readable touch targets, no duplicated instruction blocks.
6. **Progress**: save/reopen, no double credit on replay, correct mission advances.
7. **Pedagogy**: clear unambiguous correct answer, non-stereotyped presentation,
   level differentiation, sourced geography, meaningful inference from maps/photos.

## Automated QA pipeline
- `npm run build`
- `node scripts/qa-place-geography.mjs .` (when available)
- `npm run qa:images` (when available)
- Playwright browser tests for every country + mission, both tablet viewports,
  actual image loads, correct+incorrect interactions, P02 drag/drop, P08 route,
  P10 three keys and progress persistence.
- Keep failed screenshots, trace, country, mission, viewport and error in reports.
- Report static failures, browser failures and source/content uncertainties separately.
- Require zero verified blocking failures before claiming A-group completion.

## First steps for GPT Work
1. Verify remote branch status and identify missing local-only files.
2. Obtain sanitized local snapshot or confirmed local branch push.
3. Import snapshot into a new branch or reconcile with this branch using Git.
4. Run tests; fix the source of failure, not just loosen selectors to hide bugs.
5. Validate all A 110 missions and issue a country x P01–P10 report.
6. Commit fixes and create review PR; report what remains unverified.
7. Only after explicit approval, expand the validated pattern to B–Z (197 countries).

## Red flags to prevent incorrect completion claims
- A successful Vite build does not guarantee working map clicks.
- Commons API 200/valid file does not guarantee a geographically accurate photo.
- A Playwright pass on SVG counts does not guarantee correct answer logic.
- An installed ZIP or a staged `git add` is not a GitHub push.
- A QA count for 28 countries does not include Rwanda unless explicitly reported.
