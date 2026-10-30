# Place / Map release — 197 countries

The Place Adventure launcher now uses the original Rwanda page shell for every canonical country. Rwanda retains its original ten activities; the other 196 country curricula adapt those ten activity types to actual geography. Mission IDs remain `xx-place-01` through `xx-place-10`, preserving existing completion records.

The curriculum covers world/region location, land-border card placement (or nearest mapped country and direction for island countries), silhouette recognition, capital location, four real places, photograph comparison, evidence limits, a reference route to a sourced seaport, and the three-key final challenge. Capital and city challenges hide answer labels during the challenge. City-states use actual named districts, buildings or squares rather than invented cities.

## Data and scope

- Natural Earth 1:10m supplies country outlines and topological borders. GeoNames supplies stable place identities and coordinates. Raw source links and role exceptions are recorded in `sources197.json` and each country profile.
- Nearest-country comparisons use the mapped coasts of the application's 197 countries, including small islands and overseas territories. They are approximate coastline comparisons, not capital distances; Cook Islands and Niue are not classified as New Zealand territories. Direction uses the recorded nearest shore pair. The definition is shown in the activity.
- The Denmark–Canada and Botswana–Zambia short land borders have explicit source-backed supplements. Boundary and capital-role notes avoid taking a position on territorial disputes.
- Routes illustrate a geographic country chain to an actual sea-connected port, using Natural Earth and NGA World Port Index records. A reference route is shown first; the activity explicitly allows that other routes may exist and does not present the reference as a transport recommendation.
- New photographs are optimized local assets with pinned SHA-256, source, author and license. All 394 manifest photographs were inspected as contact sheets; corrections are recorded in `photo-review197.json`. This is a visual scene review, not independent geolocation of every camera position. Rwanda's existing original activity media remain unchanged.

## Validation

`npm run build` gates release on the 197-country geography, Creator progress and shared language tests. Geography tests exercise all 1,970 scoring gates, reject wrong and incomplete answers, validate actual outline identity and projection of 788 places, check selected capital-role exceptions and reciprocal borders, verify shore directions and route transitions, and verify all 394 manifest image hashes and licenses. Existing geography progress, topology and source-ledger tests also pass.

The new modules pass targeted ESLint. MissionCreator and PublishedMissionManager retain their pre-existing 11 and 2 lint findings. Vite retains warnings about large chunks and an existing ineffective language-data dynamic import. The detailed geography map/activity code is lazy loaded when Place Adventure opens.

Mission Creator reads the same live curriculum for its 10/10 completion totals and read-only published-question descriptions. Built-in releases are not fabricated Creator submissions or approvals. Existing GAS deployment and setup functions are untouched.

Production interaction checks completed on 2026-10-30: Nepal's ten activities reach 10/10 and 1,000 WP; the neighbor puzzle rejects a mismatched card; an island nearest-country/direction challenge clears for Naoero → Kiribati → east. Detailed Vatican review found Natural Earth's generalized outline inadequate for its museum locations. `boundary-overrides197.json` supplies the public-domain geoBoundaries/Wikimedia detailed outline, with source and original hash retained; regression checks require all four sourced Vatican points to lie inside it. Other map boundaries/coastlines remain generalized and are identified as such in the map control legend. Home journey totals include completed Place Adventure records.

## Rebuild

`scripts/build-geography197.py --source-dir <download-directory>` creates country/map/source data from the listed public datasets. It requires Shapely, NumPy and SciPy. `scripts/build-geography197-photos.py` resolves Commons metadata and licenses, uses an identified educational API client, preserves complete pinned photo pairs, and saves local optimized images. Review broad search fallbacks visually before any replacement release.
