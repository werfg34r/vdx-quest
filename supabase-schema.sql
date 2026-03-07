-- VDX Quest - Schema Supabase
-- A executer dans SQL Editor de Supabase

create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_stage int default 0,
  total_xp int default 0,
  current_week int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.user_stats (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  clarte int default 0,
  courage int default 0,
  terrain int default 0,
  structure int default 0,
  updated_at timestamptz default now(),
  unique(user_id)
);

create table public.quest_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  quest_id text not null,
  week_id int not null,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, quest_id)
);

create table public.reflections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  reflection_id text not null,
  week_id int not null,
  answer text,
  updated_at timestamptz default now(),
  unique(user_id, reflection_id)
);

create table public.week_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  week_id int not null,
  unlocked boolean default false,
  completed boolean default false,
  unlocked_at timestamptz,
  completed_at timestamptz,
  unique(user_id, week_id)
);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.user_stats enable row level security;
alter table public.quest_progress enable row level security;
alter table public.reflections enable row level security;
alter table public.week_progress enable row level security;

create policy "Users own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "Users own stats" on public.user_stats for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own quests" on public.quest_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own reflections" on public.reflections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own weeks" on public.week_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.user_stats (user_id) values (new.id);
  insert into public.week_progress (user_id, week_id, unlocked, unlocked_at) values (new.id, 1, true, now());
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
