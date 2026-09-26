-- Lets a teacher be status='approved' (so they can use the dashboard's
-- purchase flow — 프리미엄 프로필/플러스 — like any real teacher) without
-- showing up on the public site, for accounts that need to stay approved
-- indefinitely but must never be discoverable by real students (e.g. a
-- Toss Payments reviewer's test account). status alone can't express this,
-- since /find and the public profile page both key their visibility off
-- status='approved' directly.

alter table teachers
  add column if not exists is_test boolean not null default false;
