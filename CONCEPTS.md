# Concepts

Shared domain vocabulary for this project — entities, named processes, and status concepts with project-specific meaning. Seeded with core domain vocabulary, then accretes as ce-compound and ce-compound-refresh process learnings; direct edits are fine. Glossary only, not a spec or catch-all.

## Menu data

### Meal
A single named dish tracked across time. Meal identity is its name compared case-insensitively across days, with the first-seen casing kept as canonical — the same dish scraped on different days with different capitalisation is one Meal, not several.

### Daily Menu
The scraped record of one venue's meals for a single day: the raw, immutable input to the merge. One Daily Menu is stored per venue per day. Daily Menus are never edited to fix downstream data problems — derived data is rebuilt from them instead.

### Price Entry
A single dated observation of a Meal's price within its Merged History — an amount plus its currency, optionally weight and unit. Prices from the лв/EUR changeover era are comparable across currencies through the fixed euro peg, so two Price Entries count as the same price when they are equal after converting to a common currency, not only when their raw fields match.

### Merged History
The per-Meal, deduplicated time series of Price Entries (and image observations) built from all of a venue's Daily Menus. A new observation is recorded only when it represents a real change from the previous one; a re-observation of an unchanged value — including the same price shown in a different currency — is not appended. This "change-only" rule is what makes the Merged History a compact history rather than a per-day log.
