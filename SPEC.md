# Spec: Security hardening + monthly security audit routine

## Goal
Close the current Supabase RLS gaps without breaking any site feature, and add a monthly Claude Code routine that scans the database, code and live site for security risks and opens a PR with a report and proposed fixes.

## Included

**Part 1: one-time hardening**
- `lib/supabaseAdmin.js`: server-only Supabase client using `SUPABASE_SERVICE_ROLE_KEY` (throws if imported in the browser or if the key is missing).
- Switch server code that runs without a user session to that client: Toss success/webhook and tier routes, `lib/premiumActivation.js`, `lib/tierActivation.js`, NicePay routes, `app/api/cron/daily-digest`, `app/api/notify-subscribers`, `app/api/dashboard/*`, `app/api/admin/posts`, `app/api/teachers/notify-approved`.
- Auth checks on API routes that are open today: `dashboard/*` and `admin/posts` require a logged-in admin; webhooks keep/verify their signature or server-side payment confirmation.
- Remove `pages/api/hello.js` and `app/api/test-email`.
- One migration file, `supabase/migrations/2026MMDD_security_rls.sql`:
  - `public.is_admin()` (`SECURITY DEFINER`, fixed `search_path`) based on `users.role = 'admin'`.
  - Enable RLS on: `student_jobs`, `payment_request`, `successful_payments`, `teacher_premium`, `newsletter_subscriptions`, `page_events`, `student_job_views`, `hagwon_request_views`, `hagwons`, with policies matching how the site uses each table today (public insert where visitors submit forms or log events, owner/admin read, admin-only for payment tables).
  - `student_jobs`: revoke `select` on `kakao_contact` and the password hash column from `anon`/`authenticated`; public reads use explicit columns. New RPCs: contact info for 플러스 teachers and owners, and `update_student_job_status` that checks the password server-side. `reveal_student_job` stays the free-tier path.
  - Fixed `search_path` on existing `SECURITY DEFINER` functions that lack it.
- Update `/students` pages to select explicit columns, get contact info only via RPCs, and edit via the password RPC. No visible change for users.

**Part 2: monthly routine**
- `content/security/audit-routine-prompt.md`: instructions for the routine, following the style of `content/seo/audit-routine-prompt.md`.
- Checks:
  1. Supabase (read-only via connector): RLS on every public table, broad write policies (`using (true)`), `SECURITY DEFINER` without `search_path`, `anon` grants on sensitive columns, security advisors.
  2. API routes: every route in `app/api/` has the right auth; webhooks verify payments.
  3. Secrets: no service-role key or secrets in client code, `NEXT_PUBLIC_*`, or git history of the month.
  4. `npm audit` (high/critical).
  5. Live site: security headers on https://www.ibmaster.net, and that `.env`, source maps and removed routes return 404.
- Output: report at `content/security/audits/YYYY-MM-DD.md` (findings with severity `critical`/`high`/`medium`/`low`, file or table, proposed fix), code fixes, and any proposed SQL as a new migration file. Opens one `security-audit:` PR.
- Create the routine: fresh session each run, 10th of every month around 9am KST (`CRON_TZ=Asia/Seoul`, jittered minute before 9:00), Supabase connector attached.
- Add both routines/files to `CLAUDE.md`.

## Not included
- The routine never writes to the live database, never merges, and never changes Toss/payment logic or prices beyond the client swap above.
- Policies for the unlaunched community tables (they stay locked: RLS on, no policies); handled when the board launches.
- Rate limiting, WAF, CSP rollout (CSP is reported, not added, this round).
- Removing NicePay.

## Rules
- "Ask before changing" areas touched, approved in this interview: payment code (client swap only, the `pending` → `paid` guard stays), and a new migration. The migration is run by hand in the Supabase dashboard.
- Rollout order: (1) add `SUPABASE_SERVICE_ROLE_KEY` in Vercel, (2) merge and deploy the code, (3) run the migration. The PR description states this order.
- `SUPABASE_SERVICE_ROLE_KEY` is never `NEXT_PUBLIC_`, never imported by a client component.
- Keep the `is_test` filter on public teacher queries.
- Routine: skip if a `security-audit:` PR is already open; Supabase access read-only (`select` queries and advisors only); never print secret values; never weaken an existing policy.
- Site text Korean; code, comments, report English.

## Done when
- [ ] No file imported by a client component imports `lib/supabaseAdmin.js` (grep check).
- [ ] Every table listed above has `enable row level security` and at least one policy in the migration; `kakao_contact` and the password hash are not selectable by `anon`.
- [ ] Before the migration is applied, each policy is checked against every `.from('<table>')` call in the code, with a table → operation → role → policy list in the PR description showing nothing the site does is blocked.
- [ ] `/students` no longer uses `select('*')` on `student_jobs`; reveal, 플러스 auto-reveal, and password edit go through RPCs.
- [ ] `dashboard/*` and `admin/posts` return 401/403 without an admin session; `hello` and `test-email` are gone.
- [ ] `content/security/audit-routine-prompt.md` exists and covers all five checks; the routine exists (10th monthly, ~9am KST, Supabase connector).
- [ ] `CLAUDE.md` mentions the service-role client and the security routine.
- [ ] `npm run build` passes.
