-- Enable required extensions
create extension if not exists "pg_trgm";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  preferences jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Notebooks
create table public.notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.notebooks(id) on delete set null,
  name text not null default 'Untitled Notebook',
  icon text,
  color text,
  sort_order integer default 0,
  depth integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notebooks enable row level security;
create policy "Users can manage own notebooks" on public.notebooks for all using (auth.uid() = user_id);

create index idx_notebooks_user_id on public.notebooks(user_id);
create index idx_notebooks_parent_id on public.notebooks(parent_id);

-- Notes
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notebook_id uuid references public.notebooks(id) on delete set null,
  title text not null default 'Untitled',
  content jsonb default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  plain_text text default '',
  search_vector tsvector,
  is_favorited boolean default false,
  is_pinned boolean default false,
  is_trashed boolean default false,
  trashed_at timestamptz,
  word_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notes enable row level security;
create policy "Users can manage own notes" on public.notes for all using (auth.uid() = user_id);

create index idx_notes_user_id on public.notes(user_id);
create index idx_notes_notebook_id on public.notes(notebook_id);
create index idx_notes_search_vector on public.notes using gin(search_vector);
create index idx_notes_plain_text_trgm on public.notes using gin(plain_text gin_trgm_ops);
create index idx_notes_is_trashed on public.notes(is_trashed);
create index idx_notes_is_favorited on public.notes(is_favorited);
create index idx_notes_updated_at on public.notes(updated_at desc);

-- Tags
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text default '#6b7280',
  created_at timestamptz default now(),
  unique(user_id, name)
);

alter table public.tags enable row level security;
create policy "Users can manage own tags" on public.tags for all using (auth.uid() = user_id);

create index idx_tags_user_id on public.tags(user_id);

-- Note Tags (join table)
create table public.note_tags (
  note_id uuid not null references public.notes(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (note_id, tag_id)
);

alter table public.note_tags enable row level security;
create policy "Users can manage own note_tags" on public.note_tags for all
  using (exists (select 1 from public.notes where notes.id = note_tags.note_id and notes.user_id = auth.uid()));

-- Note Versions
create table public.note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  content jsonb,
  version_number integer not null,
  created_at timestamptz default now()
);

alter table public.note_versions enable row level security;
create policy "Users can manage own versions" on public.note_versions for all using (auth.uid() = user_id);

create index idx_note_versions_note_id on public.note_versions(note_id);

-- Shared Links
create table public.shared_links (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  password_hash text,
  expires_at timestamptz,
  is_active boolean default true,
  view_count integer default 0,
  created_at timestamptz default now()
);

alter table public.shared_links enable row level security;
create policy "Users can manage own shared_links" on public.shared_links for all using (auth.uid() = user_id);

create index idx_shared_links_token on public.shared_links(token);

-- Attachments
create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text not null,
  file_type text,
  file_size bigint,
  storage_path text not null,
  ocr_text text,
  ocr_search_vector tsvector,
  created_at timestamptz default now()
);

alter table public.attachments enable row level security;
create policy "Users can manage own attachments" on public.attachments for all using (auth.uid() = user_id);

create index idx_attachments_note_id on public.attachments(note_id);

-- Templates
create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  content jsonb not null default '{}'::jsonb,
  category text,
  is_system boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.templates enable row level security;
create policy "Users can manage own templates" on public.templates for all
  using (auth.uid() = user_id or is_system = true);

-- Audio Recordings
create table public.audio_recordings (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  duration_seconds integer,
  created_at timestamptz default now()
);

alter table public.audio_recordings enable row level security;
create policy "Users can manage own recordings" on public.audio_recordings for all using (auth.uid() = user_id);

-- Triggers

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Update search vector on note change
create or replace function public.update_note_search_vector()
returns trigger as $$
begin
  new.search_vector := to_tsvector('english', coalesce(new.title, '') || ' ' || coalesce(new.plain_text, ''));
  return new;
end;
$$ language plpgsql;

create trigger update_note_search_vector
  before insert or update of title, plain_text on public.notes
  for each row execute function public.update_note_search_vector();

-- Update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_notes_updated_at before update on public.notes
  for each row execute function public.update_updated_at();
create trigger update_notebooks_updated_at before update on public.notebooks
  for each row execute function public.update_updated_at();
create trigger update_profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger update_templates_updated_at before update on public.templates
  for each row execute function public.update_updated_at();
