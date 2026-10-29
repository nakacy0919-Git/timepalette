# Creator choice feedback — 2026-10-28

Production change: large retry animation, gentle synthesized sine-tone feedback with mute control; correct answer opens the original question photo beside the explanation. No external audio dependency. Reduced-motion preference disables animations. Keyboard focus enters and stays in feedback.

Points use the mission setting (published Creator choices currently 10 WP); first-entry completion is latched, a synchronous ref prevents repeat completion, and review shows 加点済み. Existing world progress remains idempotent; no point inflation or migration. Geography retains its existing 100 WP setting and MISSION CLEAR / first-clear / review wording.

Playwright: 1024×768, 820×1180, 1440×900 pass wrong/no completion, retry, correct/one completion, same-photo explanation loaded, visible buttons/photo, explanation reopening without repeat completion, audio oscillator creation. Reopening a completed mission yields no completion callback. Physical iPad Safari and subjective loudness not tested. Test photo is a layout fixture, not a certification of question/photo semantic matching.

No Worker/backend, question bank or unrelated open-response WIP included.

## Bright classroom revision — 2026-10-28
Light mint/yellow success and peach retry panels, bold Gothic system-font stack, dark text, 54 decorative CSS confetti particles (finite duration, pointer-events none, disabled for reduced motion). Source URLs in plain explanation become labeled buttons, never raw HTML. HTTP(S) validation excludes javascript/data links. Sources open a sandboxed in-app iframe; blocked embedding is not bypassed and a persistent notice explains the limitation. Close returns to the same photo/explanation without changing completion. No proxy, remote HTML injection or new-tab navigation is used.

QA: three viewports pass loaded in-app source fixture, one browser tab, same photo on return, confetti elements, existing retry/point tests. Reduced-motion, muted audio, and long explanation with persistent footer pass. The embedded source test uses a controlled fixture; compatibility of every third-party source is not certified. Japanese bold-font screenshots inspected at landscape/portrait sizes. Physical iPad remains untested.
