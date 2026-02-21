create extension if not exists pgcrypto;

create table if not exists public.scores (
    id uuid primary key default gen_random_uuid(),
    nickname text not null,
    score integer not null check (score >= 0),
    score_date_utc date not null,
    mode text not null default 'RANKED' check (mode in ('RANKED', 'ZEN')),
    created_at timestamptz not null default now(),
    ip_hash text null
);

create index if not exists idx_scores_date_score_created
    on public.scores (score_date_utc, score desc, created_at asc);

create index if not exists idx_scores_nickname_date_score
    on public.scores (nickname, score_date_utc, score desc);

create index if not exists idx_scores_nickname_score
    on public.scores (nickname, score desc);

create or replace view public.daily_leaderboard as
with daily_best as (
    select
        score_date_utc,
        nickname,
        max(score) as score
    from public.scores
    group by score_date_utc, nickname
)
select
    score_date_utc,
    nickname,
    score,
    row_number() over (
        partition by score_date_utc
        order by score desc, nickname asc
    ) as rank
from daily_best;

create or replace view public.all_time_leaderboard as
with lifetime_best as (
    select
        nickname,
        max(score) as score
    from public.scores
    group by nickname
)
select
    nickname,
    score,
    row_number() over (
        order by score desc, nickname asc
    ) as rank
from lifetime_best;

alter table public.scores enable row level security;

drop policy if exists "allow_anon_insert_scores" on public.scores;
create policy "allow_anon_insert_scores"
    on public.scores
    for insert
    to anon
    with check (
        char_length(trim(nickname)) between 3 and 16
        and nickname ~ '^[A-Za-z0-9 _-]+$'
        and score >= 0
        and mode in ('RANKED', 'ZEN')
    );

drop policy if exists "deny_anon_select_scores" on public.scores;
create policy "deny_anon_select_scores"
    on public.scores
    for select
    to anon
    using (false);

grant select on public.daily_leaderboard to anon;
grant select on public.all_time_leaderboard to anon;
