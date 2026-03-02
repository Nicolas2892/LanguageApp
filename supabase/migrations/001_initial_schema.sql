-- ============================================================
-- Spanish B1→B2 App — Initial Schema
-- Run this in the Supabase SQL editor (or via CLI)
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────
-- One row per auth.users row, created on signup via trigger.
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  display_name        text,
  current_level       text not null default 'B1',
  daily_goal_minutes  integer not null default 15,
  streak              integer not null default 0,
  last_studied_date   date,
  created_at          timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Curriculum ──────────────────────────────────────────────

create table public.modules (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  order_index integer not null,
  created_at  timestamptz not null default now()
);

alter table public.modules enable row level security;

create policy "Modules are publicly readable"
  on public.modules for select
  using (true);

-- Service role can insert/update (used by seed scripts)
create policy "Service role can manage modules"
  on public.modules for all
  using (auth.role() = 'service_role');


create table public.units (
  id          uuid primary key default uuid_generate_v4(),
  module_id   uuid not null references public.modules(id) on delete cascade,
  title       text not null,
  order_index integer not null,
  created_at  timestamptz not null default now()
);

alter table public.units enable row level security;

create policy "Units are publicly readable"
  on public.units for select
  using (true);

create policy "Service role can manage units"
  on public.units for all
  using (auth.role() = 'service_role');


create table public.concepts (
  id          uuid primary key default uuid_generate_v4(),
  unit_id     uuid not null references public.units(id) on delete cascade,
  type        text not null,          -- 'connector' | 'subjunctive' | 'vocabulary' | etc.
  title       text not null,
  explanation text not null,
  examples    jsonb not null default '[]',
  difficulty  integer not null default 1 check (difficulty between 1 and 5),
  created_at  timestamptz not null default now()
);

alter table public.concepts enable row level security;

create policy "Concepts are publicly readable"
  on public.concepts for select
  using (true);

create policy "Service role can manage concepts"
  on public.concepts for all
  using (auth.role() = 'service_role');


create table public.exercises (
  id              uuid primary key default uuid_generate_v4(),
  concept_id      uuid not null references public.concepts(id) on delete cascade,
  type            text not null,     -- 'gap_fill' | 'transformation' | 'translation' | 'free_write' | 'error_correction' | 'sentence_builder'
  prompt          text not null,
  expected_answer text,              -- null for open-ended (AI-graded only)
  answer_variants jsonb,             -- accepted alternative wordings
  hint_1          text,
  hint_2          text,
  created_at      timestamptz not null default now()
);

alter table public.exercises enable row level security;

create policy "Exercises are publicly readable"
  on public.exercises for select
  using (true);

create policy "Service role can manage exercises"
  on public.exercises for all
  using (auth.role() = 'service_role');

-- ─── User Progress (SRS) ─────────────────────────────────────

create table public.user_progress (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  concept_id       uuid not null references public.concepts(id) on delete cascade,
  ease_factor      numeric(4,2) not null default 2.5,
  interval_days    integer not null default 1,
  due_date         date not null default current_date,
  repetitions      integer not null default 0,
  last_reviewed_at timestamptz,
  unique (user_id, concept_id)
);

alter table public.user_progress enable row level security;

create policy "Users can view own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

create policy "Users can insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

create policy "Users can update own progress"
  on public.user_progress for update
  using (auth.uid() = user_id);

-- ─── Exercise Attempts ───────────────────────────────────────

create table public.exercise_attempts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  user_answer text not null,
  is_correct  boolean,
  ai_score    smallint check (ai_score between 0 and 3),
  ai_feedback text,
  created_at  timestamptz not null default now()
);

alter table public.exercise_attempts enable row level security;

create policy "Users can view own attempts"
  on public.exercise_attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert own attempts"
  on public.exercise_attempts for insert
  with check (auth.uid() = user_id);

-- ─── Study Sessions ───────────────────────────────────────────

create table public.study_sessions (
  id                 uuid primary key default uuid_generate_v4(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  started_at         timestamptz not null default now(),
  ended_at           timestamptz,
  concepts_reviewed  integer not null default 0,
  accuracy           numeric(5,2)
);

alter table public.study_sessions enable row level security;

create policy "Users can view own sessions"
  on public.study_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sessions"
  on public.study_sessions for update
  using (auth.uid() = user_id);

-- ─── Indexes ─────────────────────────────────────────────────

create index on public.user_progress (user_id, due_date);
create index on public.exercise_attempts (user_id, created_at desc);
create index on public.exercises (concept_id);
create index on public.concepts (unit_id);
create index on public.units (module_id);
