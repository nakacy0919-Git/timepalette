# Creator choice feedback — 2026-10-28

Production change: large retry animation, gentle synthesized sine-tone feedback with mute control; correct answer opens the original question photo beside the explanation. No external audio dependency. Reduced-motion preference disables animations. Keyboard focus enters and stays in feedback.

Points use the mission setting (published Creator choices currently 10 WP); first-entry completion is latched, a synchronous ref prevents repeat completion, and review shows 加点済み. Existing world progress remains idempotent; no point inflation or migration. Geography retains its existing 100 WP setting and MISSION CLEAR / first-clear / review wording.

Playwright: 1024×768, 820×1180, 1440×900 pass wrong/no completion, retry, correct/one completion, same-photo explanation loaded, visible buttons/photo, explanation reopening without repeat completion, audio oscillator creation. Reopening a completed mission yields no completion callback. Physical iPad Safari and subjective loudness not tested. Test photo is a layout fixture, not a certification of question/photo semantic matching.

No Worker/backend, question bank or unrelated open-response WIP included.
