# Inline country-selection toolbar and flags — 2026-10-28

Moves map/continent/A–Z/search controls beside the country-selection heading, replacing their separate row. The map fills the recovered vertical space. At phone widths controls wrap; tested tablet/PC sizes keep them on the heading row.

Hovered/focused country now shows an actual flag PNG rather than platform-dependent flag emoji. All 197 flags are embedded in a 112KB data file, sourced from flagcdn.com/w80/{iso}.png (https://flagpedia.net/download/api). Country ISO keys determine matching; runtime flag display requires no third-party image fetch. Existing country dataset and map projection unchanged.

Actual App Playwright: 1920×1080,1024×768,820×1180 pass inline control placement, map bounds/page overflow, Brazilian flag decode and country selection. All 197 bundled flag PNGs decode in Chromium. Existing home Tools→Timer→Adventure flow still passes. Physical iPad Safari and manual visual/content review of every flag are not claimed.
