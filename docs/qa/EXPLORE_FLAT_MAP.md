# Flat country selection map — 2026-10-28

ExploreWorld country picker now uses equirectangular projection (scale 180, center 0/0, initial zoom 1), replacing Equal Earth. Straight meridians/parallels assist selection; subtle 30-degree graticule ignores pointer events. Existing atlas mapping, country callbacks, colors, drag/zoom, search/continent/A–Z routes remain. This projection is not equal-area: high-latitude countries appear enlarged. No changes to geography mission maps or answer coordinates.

Actual ExploreWorld Playwright fixture: 1024×768, 820×1180, 1440×900; over150 interactive countries, Brazil opens its correct country panel by pointer (landscape/PC) or Enter (portrait), zoom/reset preserves path and map stays horizontally within viewport. Published catalog is mocked empty for deterministic UI; physical iPad not tested. Landscape screenshot visually reviewed.
