# Country selection navigation — 2026-10-28

Home and Explore omit MainHeader (brand/Adventure/Explore/My Journey/Tools). Tools remains accessible as a compact top-right Japanese button on the initial home screen, reusing the existing ToolsMenu and tool routing. Tool pages keep their existing return navigation. Country selection landing also offers a small home return control.

Home, country-selection landing and map screens now use 100dvh rather than subtracting 68px. No projection or country selection logic changed. Existing zoom and map controls preserved.

Playwright against the actual local App: 1920×1080,1024×768,820×1180 pass initial-home tool position, Tools→Timer→Adventure return, navigation removal, no page overflow, map bounds and Brazil country selection. Build passes. Physical iPad Safari untested.
