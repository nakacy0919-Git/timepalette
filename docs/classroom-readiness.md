# Classroom readiness review — 2026-11-12

Scope: source review of the learner experience, browser storage, source viewer,
and existing Mission Creator authorization tests. This is not a penetration test
of the live service, school devices, DNS, or deployed infrastructure.

## Classroom uses

| School stage | Independent student work | Teacher-led use |
| --- | --- | --- |
| Elementary | Locate countries, manipulate clocks, practise greetings | Project flags and photographs; predict answers in pairs |
| Junior high | Calculate time differences, introduce school life | Compare suitable exchange times and explain reasoning |
| High school | Check sources, compare cultures and connections with Japan | Discuss multiple sources and contrasting interpretations |

## Implemented

- A classroom entry point with country, category and level settings, including
  a lesson URL that carries only those public settings. It does not share names,
  schools, answers or login tokens. Learners explicitly choose how to start.
- Personal practice retains the existing browser-local progress. Shared-device
  practice and teacher demonstrations use separate memory-only stores for both
  mission progress and Language Adventure profiles. Starting either creates a
  fresh session; reloading discards it. Existing personal records are untouched.
- A confirmed deletion action removes learner progress and language inputs,
  preserving Creator credentials and unrelated browser settings.
- Local JSON export contains completion counts by country/category, timestamp
  and storage mode. It excludes profiles, answer text and audio. It is not a
  verified student assessment or an automatic teacher gradebook.
- Classroom guidance includes nicknames, fictional school names, microphone
  considerations and typed practice. Music controls are absent in this route.
- Source viewer links require HTTPS, no credentials, no alternate ports, and
  no literal IP addresses or common local host suffixes. This is a client-side
  link guard, not DNS-aware server-side SSRF protection or a content allowlist.
- Hosting configuration adds MIME sniffing, referrer, camera/geolocation and
  object/base protections. Creator additionally disallows framing. Deployment
  is required before these HTTP headers affect production.

## Findings and remaining boundaries

The main classroom privacy problem was that demonstrations and successive
users of one device shared persistent learner records. The new modes isolate
future sessions; previously saved personal data remains until explicitly deleted.
Completion records are client-controlled and can be edited or reset. They should
not be used as proof of identity or high-stakes grading. No automatic collection,
student accounts or classwide analytics were added: those need an explicit
school data policy, authenticated ownership and retention rules.

Published content availability differs by country, category and level. The UI
does not promise ten published missions for every combination. Browser speech
recognition may use the browser vendor's remote service; typed practice remains
the alternative. Third-party sources can change and may refuse iframe display.

Existing Worker tests exercise authentication, ownership, publication, revocation
and role isolation. Passing them does not establish that production secrets,
rate limits, backups or every API are secure. Production dependency audit found
zero known advisories at review time; no dependencies were changed.

## Validation

- Full `npm test`: 180 Node tests, GAS access-control suite, Worker integration
  suite and quick-PIN role-isolation suite passed.
- Added tests for lesson URL sanitization, actual progress-store isolation,
  selective deletion, export data minimization and unsafe source URLs.
- Production build passed.
- Interactive visual QA could not be completed: the cloud browser could not
  reach the local preview and the desktop accessibility provider was unavailable.
  iPad layout and clipboard/download interactions therefore still need a real
  browser check before merging. No production deployment was performed.

## Follow-up: practical classroom preparation

- Completion backup and confirmed restore merge records across devices without
  deleting newer progress. Files exclude profiles, answers and notebook text;
  imported records do not award additional points. This remains self-reported
  practice, not verified assessment.
- Import validates the entire file before writes: 1 MB, at most 250 country
  entries and 20,000 mission entries, country/identifier/category constraints,
  no duplicate country/mission records, and explicit field selection. Storage
  write failures attempt rollback and show an error rather than success.
- A notebook stores the latest goal, evidence-based discovery and next question
  per country/category/level (600 characters each, most recent 200 lessons).
  Personal mode persists locally; shared/demo mode uses memory only. The learner
  deletion action also clears notebooks. Print/PDF output includes the full text;
  notebooks are excluded from completion backup to avoid moving free text.
- Fixed retained memory-storage adapters following a later mode switch.
- Local-source suffix checks now normalize trailing DNS dots; source iframes
  no longer permit form submission. DNS rebinding and third-party tracking are
  not solved by a URL string check.
- Additional tests cover real restore across progress stores, merge idempotency,
  data minimization, malformed/oversized imports, rollback, retained storage
  scope and trailing-dot local URLs. Full suites and build passed; targeted lint
  passed. Browser/iPad visual validation remains pending.
