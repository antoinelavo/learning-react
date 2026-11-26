# Spec: Weekly marketplace health report routine

## Goal
A weekly Claude Code routine that reads aggregate marketplace numbers from Supabase and opens one PR with a short report and 3-5 recommended actions, so the owner can spot problems in under 2 hours a week.

## Included
- `content/marketplace/routine-prompt.md`: the routine's instructions, in the same style as `content/seo/audit-routine-prompt.md` (setup, open-PR guard, branch, steps, PR rules).
- `content/marketplace/reports/` folder. The routine writes `content/marketplace/reports/YYYY-MM-DD.md` each run (KST date).
- Report sections:
  - **A. Funnel:** new student requests, new hagwon requests, reveals, teachers who revealed, new sign-ups. Each compared with the previous week.
  - **B. Supply and demand health:** OPEN requests by age, OPEN requests older than 30 days (stale), requests with zero reveals, the teacher approval backlog (pending count and oldest age).
  - **C. Revenue:** paid, pending and refunded payments, paid teacher count, free teachers who hit the reveal cap.
  - **D. Chat:** conversations started, share with a teacher reply, conversations with no teacher reply after 48 hours.
  - **Recommended actions:** the top 3-5, each tied to a number in the report and doable in under 2 hours.
- Schedule: Mondays 9am KST. This is set up by the owner when creating the routine (not by code).

## Not included
- Traffic and `page_events` (only the hagwon pages are tracked).
- Any change to production data: no closing requests, approving teachers, or sending emails. Actions are suggestions only.
- The teacher approval triage routine (a separate spec).
- New API routes, pages, migrations, or app code.

## Rules
- Read-only SQL through the Supabase connector (project `scdoramzssnimcbsojml`). Aggregate counts and ages only.
- The report must never contain emails, names, usernames, Kakao contacts, message text, bank details, or any per-person or per-request identifier.
- A request is **stale** when its status is OPEN and it is older than 30 days.
- Before anything else, stop if a PR titled `marketplace-report:` is already open. Report "Previous report PR still open: <link>" and change nothing.
- Branch `marketplace-report/YYYY-MM-DD` from the latest `main`. The PR title starts with `marketplace-report:`. A human reviews and merges it; the routine never merges.
- Week-over-week figures come from the previous report file in the folder. The first run says "no previous report" and shows no comparison.
- Test teachers (`teachers.is_test = true`) are excluded from all teacher counts.
- If a query fails, write "n/a (query failed)" for that figure, still open the PR, and list the failure at the top of the report.
- Report text is Korean-site-agnostic: write it in English; the prompt, code and commit messages are English too.
- Touches no "Ask before changing" areas (payments, migrations, blog, legal pages). Payment data is read only.

## Done when
- [ ] `content/marketplace/routine-prompt.md` exists and covers setup, the open-PR guard, the branch name, every report section (A, B, C, D, recommended actions), the privacy rule, failure handling, and PR rules.
- [ ] Every SQL query in the prompt was run successfully against the live database and returns aggregates only.
- [ ] An example report built from those queries is saved as `content/marketplace/reports/` for the current date, with no personal data in it.
- [ ] `CLAUDE.md` lists the new routine next to the other routines (Monday 9am KST).
- [ ] `npm run build` passes.
