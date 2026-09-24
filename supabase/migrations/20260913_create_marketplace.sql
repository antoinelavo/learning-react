-- IB resources marketplace: teachers sell PDF resources to students,
-- paid via Toss (same confirm/webhook shape as app/api/toss/**), with a
-- manual monthly payout workflow for admins.
--
-- Note on RLS: writes to these tables go through server API routes using
-- the shared anon-key client (this codebase has no service-role key —
-- see lib/supabase.js / app/api/toss/**), which is the same trust model
-- already used for payment_request/successful_payments/teacher_premium.
-- So INSERT/UPDATE policies here are permissive (the API route is the
-- real enforcement point, e.g. app/api/resources/[id]/download.js
-- verifies the caller's bearer token before ever touching R2), while
-- SELECT policies are scoped tightly since those are also queried
-- directly from authenticated client components (e.g. the marketplace
-- page, "My Purchases").

create table if not exists resources (
  id                uuid primary key default gen_random_uuid(),
  teacher_id        integer not null references teachers(id), -- teachers.id is an integer PK, not uuid
  title             text not null,
  description       text,
  subject           text not null,
  resource_type     text not null default 'subject' check (resource_type in ('subject', 'ee', 'tok')),
  session_month     text not null check (session_month in ('May', 'November')),
  session_year      int not null,
  score             text not null,
  price_krw         int not null check (price_krw >= 0),
  file_key          text not null, -- object key in the private R2 resources bucket
  file_size_bytes   int,
  status            text not null default 'active' check (status in ('active', 'unpublished')),
  created_at        timestamptz not null default now()
);

create index if not exists resources_teacher_id_idx on resources(teacher_id);
create index if not exists resources_status_idx on resources(status);
create index if not exists resources_subject_idx on resources(subject);

create table if not exists purchases (
  id                  uuid primary key default gen_random_uuid(),
  order_id            text not null unique, -- client-generated, passed through to Toss
  resource_id         uuid not null references resources(id),
  buyer_id            uuid not null references users(id),
  teacher_id          integer not null references teachers(id), -- denormalized for payout queries; teachers.id is an integer PK
  price_krw           int not null,
  platform_fee_krw    int not null,
  teacher_earning_krw int not null,
  payment_key         text,
  status              text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  payout_id           uuid, -- fk added below, after payouts exists
  created_at          timestamptz not null default now(),
  paid_at             timestamptz
);

create index if not exists purchases_buyer_id_idx on purchases(buyer_id);
create index if not exists purchases_teacher_id_idx on purchases(teacher_id);
create index if not exists purchases_resource_id_idx on purchases(resource_id);
create index if not exists purchases_status_idx on purchases(status);

create table if not exists payouts (
  id                  uuid primary key default gen_random_uuid(),
  teacher_id          integer not null references teachers(id), -- teachers.id is an integer PK
  period_month        date not null, -- first day of the month
  total_sales_krw     int not null,
  platform_fee_krw    int not null,
  teacher_earning_krw int not null,
  status              text not null default 'paid' check (status in ('paid')),
  paid_at             timestamptz not null default now(),
  note                text,
  unique (teacher_id, period_month)
);

alter table purchases
  add constraint purchases_payout_id_fkey foreign key (payout_id) references payouts(id);

create index if not exists payouts_teacher_id_idx on payouts(teacher_id);

alter table teachers
  add column if not exists bank_name text,
  add column if not exists bank_account_number text,
  add column if not exists bank_account_holder text;

alter table resources enable row level security;
alter table purchases enable row level security;
alter table payouts enable row level security;

-- resources: anyone can see active listings; the owning teacher can see
-- (and manage) all of their own regardless of status; admins see all.
create policy "public_select_active" on resources
  for select using (status = 'active');

create policy "owner_select" on resources
  for select using (exists (
    select 1 from teachers t where t.id = resources.teacher_id and t.user_id = auth.uid()
  ));

create policy "admin_select" on resources
  for select using (exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin'));

create policy "server_insert" on resources for insert with check (true);
create policy "server_update" on resources for update using (true);

-- purchases: only the buyer, the owning teacher, or an admin can read a row.
create policy "buyer_select" on purchases
  for select using (auth.uid() = buyer_id);

create policy "teacher_select" on purchases
  for select using (exists (
    select 1 from teachers t where t.id = purchases.teacher_id and t.user_id = auth.uid()
  ));

create policy "admin_select" on purchases
  for select using (exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin'));

create policy "server_insert" on purchases for insert with check (true);
create policy "server_update" on purchases for update using (true);

-- payouts: admin-only, plus the owning teacher can see their own payout history.
create policy "admin_select" on payouts
  for select using (exists (select 1 from users u where u.id = auth.uid() and u.role = 'admin'));

create policy "teacher_select" on payouts
  for select using (exists (
    select 1 from teachers t where t.id = payouts.teacher_id and t.user_id = auth.uid()
  ));

create policy "server_insert" on payouts for insert with check (true);
create policy "server_update" on payouts for update using (true);
