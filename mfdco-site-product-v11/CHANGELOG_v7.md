# MFDCO Country Operations v7

## UI / display
- Public population figures are shown in `万人` to prevent metric-card overflow while internal storage remains person-based.
- Added a dedicated geography/time page for reference city, latitude/longitude, standard meridian, timezone name and UTC/GMT offset.
- Default timezone offset can be calculated from longitude; manual override is supported.
- Added a detailed administrative-region editor with population, area, specialties, industries, culture, heritage, climate, coordinates and image.

## Food / national indicators
- Added calorie-basis, production-value-basis and intake-calorie-basis food self-sufficiency rates.
- Added food-security target, strategic reserve days, arable-land ratio and staple foods.
- Added energy self-sufficiency and renewable-energy fields.
- Added a flexible national-indicator table for statistics that do not have a dedicated field yet.
- Modern Japan template now includes FY2025 food self-sufficiency sample values: 37% calorie basis, 66% production-value basis and 45% intake-calorie basis.

## News
- News feed can create a new article directly for an owned country.
- Article fields now include title, lead/summary, body, detailed notes, related URL, preview image, date, category and publish/draft state.
- Public feed RPC exposes summary, detail and related URL fields.

## Appearance / secondary-use policy
- Added `country-rights.html`.
- Country appearance policy: anyone / report required / application required / forbidden.
- Credit policy: required / required for commercial use / optional / none, plus custom format and example.
- Commercial use: allowed / YouTube only / forbidden / custom notes.
- Setting modification: unlimited / minor changes / forbidden / custom notes.
- Defeat/destruction: welcomed / allowed / defeat only / homeland attack forbidden / forbidden / custom notes.
- Separate flag/emblem and anthem/audio conditions.
- Added optional in-site usage-request workflow and manager approval/rejection RPC.

## Data model
- Schema version advanced to 7.
- Cities are stored as stable country records in cloud mode.
- v6 local data migrates automatically to v7.
