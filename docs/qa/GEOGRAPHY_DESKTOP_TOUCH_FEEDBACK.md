# Geography desktop, touch and feedback release — 2026-10-28

Uses the full desktop width. At 1300px+ the sidebar and instructional text grow; at 1700px+ the sidebar reaches 310px with 18px mission labels. Tablet layout remains compact.

All country mission maps use d3-zoom gestures: one-finger/mouse drag, two-finger pinch, wheel, plus/minus and reset. The four visible direction buttons are removed. Arrow-key pan is retained. Fixed SVG viewport and a transformed content group keep hit targets and city coordinates synchronized. Gesture motion suppresses accidental answer clicks. d3-selection/zoom are declared at their existing locked 2.0.0 versions.

Wrong answers now show a central, animated retry message and a soft two-tone sound. Intermediate correct stages show a central success message/chime. Final completion adds finite confetti and an animated success card. Audio obeys the existing shared sound preference and an explicit on/off control. Reduced-motion preference removes confetti/animations. Feedback never changes scoring or saved IDs; image-ready gates remain active.

Verification: A110 ×2 tablet sizes ×mouse/keyboard or touch =440 passing cases; all 10 missions of Afghanistan and Australia at 1920×1080 and1440×900 =40 passing desktop cases. A separate four-viewport browser test uses Chromium CDP touchStart/touchMove/touchEnd sequences for actual pinch/finger-pan recognition, then checks reset, central feedback, generated audio, mute, confetti and replay idempotency. It also verifies sound-toggle text contrast >=4.5 and keyboard pan. 15 geography unit tests and A content/assets/release gates pass. Actual Japanese-font 1920px screenshot visually inspected.

Physical iPad Safari, subjective sound loudness and all third-party browser/hardware combinations remain unverified. Original Rwanda-specific renderer remains unchanged; these improvements apply to the shared A-country renderer. No Creator backend or unpublished bank changes included.
