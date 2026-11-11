-- 집키미 · Supabase SQL Editor에서 이 파일 → seed-terms.sql 순서로 한 번씩 실행합니다.
--
-- 표 두 개
--   terms  용어집(뜻·출처 번호). 누구나 읽기만 합니다. 내용 고치기는 seed-terms.sql을 다시 실행합니다.
--   plans  "내 계약 저장". 계약 날짜·금액·체크 상태를 코드 하나로 저장합니다.
--          브라우저는 이 표에 직접 닿지 못하고, 서버 함수(api/plans.js)가 secret 키로만 읽고 씁니다.
--          그래서 RLS는 켜 두고 정책은 만들지 않습니다(공개 역할에는 행이 하나도 보이지 않음).

-- ① 용어집 -----------------------------------------------------------------
create table if not exists public.terms (
  key        text primary key check (key ~ '^[a-z]{2,20}$'),
  name       text not null check (char_length(name) between 1 and 40),
  aka        text not null default '' check (char_length(aka) <= 40),
  def        text not null check (char_length(def) between 1 and 600),
  sources    smallint[] not null default '{}',
  sort       smallint not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.terms is '집키미 · 용어집 (공개 읽기 전용)';

alter table public.terms enable row level security;

drop policy if exists "terms: anyone can read" on public.terms;
create policy "terms: anyone can read"
  on public.terms for select
  to anon, authenticated
  using (true);

revoke all on table public.terms from anon, authenticated, public;
grant select on table public.terms to anon, authenticated;

-- ② 내 계약 저장 -------------------------------------------------------------
create table if not exists public.plans (
  code       text primary key check (code ~ '^[a-z0-9]{10}$'),
  data       jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) <= 4096),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.plans is '집키미 · 내 계약 저장 (서버 함수 전용, 공개 역할 접근 없음)';

alter table public.plans enable row level security;
-- 정책 없음: anon/authenticated는 아무 행도 읽거나 쓸 수 없습니다

revoke all on table public.plans from anon, authenticated, public;
revoke all on table public.plans from service_role;
grant select, insert, update on table public.plans to service_role;
