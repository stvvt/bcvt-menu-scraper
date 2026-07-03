# AGENTS.md

A TypeScript CLI that scrapes BCVT restaurant menus and maintains a per-meal price/image history. See `README.md` for usage.

## Commands

- `yarn build` — compile TypeScript to `dist/`.
- `yarn test` — run the Jest suite.
- `yarn lint` — ESLint over `src/`.

## Gotcha: build before scraping or merging

The scrape and merge shell scripts (`scrape.sh`, `merge.sh`, `merge_all.sh`, `bcvt-scrape.sh`) run the compiled `dist/`, which is gitignored — **not** `src/`. After changing anything under `src/`, run `yarn build` before those scripts, or they silently run stale code.

## Data model

- `db/<venue>/daily/*.json` — the raw, immutable scrape of one venue-day. Treated as source of truth; never edited to fix downstream data.
- `db/<venue>/merged.json` — the derived, deduplicated per-meal price/image history. Rebuilt from the daily files with `merge_all.sh <venue>` (after `yarn build`), so data bugs in the transform are fixed by re-running it, not by editing history.

## Knowledge store

- `docs/solutions/` — documented solutions to past problems (bugs, best practices, workflow patterns), organized by category with YAML frontmatter (`module`, `tags`, `problem_type`). Relevant when implementing or debugging in documented areas.
- `CONCEPTS.md` — shared domain vocabulary (Meal, Daily Menu, Price Entry, Merged History). Relevant when orienting to the codebase or discussing domain concepts.
- `docs/plans/` — plan and requirements artifacts for in-flight and completed work.
