# Chapter-wise Rank List

## What changed
Only one file changed: `src/pages/admin/Analytics.tsx`

The certificate and batch-year features from earlier have been fully reverted —
both in this file and in the database (the extra table/columns were dropped,
nothing was ever deployed so this was a clean rollback).

## New: chapter-wise Rank List
In Admin -> Analytics, the "Rank list" card now:
- Has a chapter dropdown — pick any published chapter
- Ranks active students by their best score on that chapter, highest to lowest
- Shows "Top 10 / All / Bottom 10" toggle
- Shows how many students have attempted vs not yet attempted that chapter
- Top 3 get a marigold badge
- Admin-only, same as before

Switch chapters from the dropdown to see performance shift per chapter —
useful for spotting which chapter is tripping up which students, not just
overall performance.

## How to deploy
1. Unzip this file.
2. In GitHub, upload `src/pages/admin/Analytics.tsx`, replacing the existing one at that path.
3. Commit. Vercel will auto-redeploy.

No database changes needed — everything else is already back to normal.

## Verified
- `tsc -b` — no type errors
- `vite build` — builds clean
