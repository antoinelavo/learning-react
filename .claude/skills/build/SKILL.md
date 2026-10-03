---
name: build
description: Build the feature described in SPEC.md, run the build and code checks until they pass, run /code-review and fix real bugs, then report what changed with proof for every "Done when" item. Use when the user runs /build after approving a spec.
---

# /build

Implement `SPEC.md`, verify it, and prove it is done.

## 1. Read the spec

- Read `SPEC.md` at the repo root. If it is missing or has no "Done when" section, stop and tell the user to run `/spec` first.
- Read `CLAUDE.md` and follow its rules. Work on a branch, never `main`.
- If the spec needs something under "Ask before changing" in `CLAUDE.md` and the spec's Rules do not already approve it, ask the user before touching it.
- New migrations go in `supabase/migrations/`. Do not run them. Tell the user to run them by hand in the Supabase dashboard.

## 2. Build it

- Make the changes listed under Included. Do nothing listed under Not included.
- Follow the existing patterns: `app/` router for new pages and API routes, `@/` imports, shared Supabase client in `lib/supabase.js`, Tailwind for styling.
- Site text in Korean. Code, comments, names, and commit messages in English.
- Never commit `.env` files or secrets.

## 3. Build and check, until clean

Run these and fix every failure, then run them again. Repeat until all pass.

1. `npm run build`: the main check. It compiles every page and catches import, syntax, and server/client component errors.
2. `npx next lint` only if an ESLint config exists in the repo. There is none today, so skip it and say so. Do not add one.
3. If the change touches `scripts/generate-sitemap.js` or sitemap routes, run `node scripts/generate-sitemap.js` (needs `.env.local`; if it is missing, say the check was skipped).

If the build fails for a reason unrelated to your change, confirm it also fails on the base branch, then report it instead of fixing unrelated code.

Keep the final passing output of each check for the summary.

## 4. Code review

Run the `/code-review` skill on the current changes. For each finding:

- Real bug: fix it.
- False positive or style nit: skip it and note why in one line.

After any fixes, go back to step 3 and rerun the checks until they pass again.

## 5. Verify "Done when"

Check every "Done when" item one by one. Use the strongest proof available:

- Build or check output.
- Running the site (`npm run dev`) and loading the page or calling the API route, with the response or a screenshot.
- The exact file and line that implements it.

If an item cannot be verified, say so plainly and why. Do not mark it done.

Tick the boxes in `SPEC.md` for items that passed.

## 6. Summary

Finish with:

- **What changed**: files added or edited, one line each.
- **Done when**: a table with each item, pass or fail, and its proof.
- **Checks**: each check, pass or skip, with the key line of output.
- **Code review**: bugs found and fixed, and findings skipped with the reason.
- **Manual steps**: anything the user must do, like running a migration or setting an env var.
