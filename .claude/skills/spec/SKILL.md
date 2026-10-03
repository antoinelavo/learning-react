---
name: spec
description: Interview the user about a feature idea one question at a time, then write a short SPEC.md (Goal, Included, Not included, Rules, Done when) and get their approval. Use when the user runs /spec or wants to plan a feature before building it.
---

# /spec

Turn a feature idea into a short, approved `SPEC.md` at the repo root.

## 1. Get the idea

If the user did not give an idea with the command, ask: "What feature do you want to build?" Then wait.

## 2. Look before asking

Read the parts of the codebase the idea touches (pages, API routes, components, Supabase tables). Read `CLAUDE.md`. This lets you ask sharper questions and skip ones the code already answers.

## 3. Interview, one question at a time

- Ask exactly one question per message, then wait for the answer.
- Keep each question short. Offer 2–4 likely options when that helps, plus your recommendation.
- Keep going until you could build it without guessing. Cover what the user may not have thought of:
  - Who uses it: students, parents, teachers, hagwons, admins, logged-out visitors?
  - Where it lives: which page or route, and how users get there.
  - Data: what is stored, in which Supabase table, and who can read or write it (RLS).
  - Edge cases: empty states, errors, duplicates, limits, mobile layout.
  - Korean site text: exact wording if it matters.
  - Money: does it touch payments, tiers, premium, or prices?
  - Email, notifications, SEO, sitemap.
  - What is explicitly out of scope for now.
- Flag anything that falls under "Ask before changing" in `CLAUDE.md` (payments, database and migrations, blog posts, legal pages). Confirm the user wants it, and note that migrations are run by hand in the Supabase dashboard.
- Stop when there are no open questions. Do not pad the interview.

## 4. Write SPEC.md

Write `SPEC.md` at the repo root, replacing any old one. Keep it short: bullets, no filler.

```markdown
# Spec: <feature name>

## Goal
One or two sentences: what this does and why.

## Included
- Each thing that will be built.

## Not included
- Things deliberately left out.

## Rules
- Behavior, permissions, data, and text rules the build must follow.
- Any "Ask before changing" areas this touches, and how.

## Done when
- [ ] Concrete, checkable outcomes. Each one must be verifiable from code, the build, or by running the site.
- [ ] `npm run build` passes.
```

## 5. Get approval

Show the full spec in your message. Ask the user to approve it or tell you what to change. Apply edits to `SPEC.md` and show it again. Repeat until they approve.

Do not finish, and do not start building, until the user approves. When approved, tell them to run `/build`.
