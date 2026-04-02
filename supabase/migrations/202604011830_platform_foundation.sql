create extension if not exists "pgcrypto";

create type public.user_role as enum ('trainee', 'coach', 'admin');
create type public.coach_application_status as enum ('pending', 'approved', 'rejected');
create type public.branding_source as enum ('app', 'coach');
create type public.relationship_source as enum ('invite', 'directory', 'none');
create type public.exercise_type as enum ('push-ups', 'squats', 'crunches', 'burpees', 'lunges');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_name text not null unique,
  email text not null unique,
  first_name text,
  last_name text,
  nationality text,
  city text,
  region text,
  is_age_confirmed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, role)
);

create table public.coach_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  nickname text not null,
  phone_number text not null,
  picture_url text not null,
  short_bio text,
  professional_credentials text,
  booking_url text,
  accent_color text not null default '#f06d4f',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.coach_business_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  business_name text,
  business_motto text,
  business_logo_url text,
  business_location text,
  business_phone_number text,
  business_email text,
  instagram_url text,
  youtube_url text,
  facebook_url text,
  linkedin_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.coach_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.coach_application_status not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  review_notes text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  submitted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index coach_applications_single_pending_idx
  on public.coach_applications (user_id)
  where status = 'pending';

create table public.coach_directory_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  application_status public.coach_application_status not null default 'pending',
  is_approved boolean generated always as (application_status = 'approved') stored,
  visibility_enabled boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.trainee_coach_relationships (
  trainee_user_id uuid primary key references public.profiles(id) on delete cascade,
  coach_user_id uuid references public.profiles(id) on delete set null,
  attached_via public.relationship_source not null default 'none',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint trainee_coach_relationship_validity check (
    ((coach_user_id is null and attached_via = 'none')
      or (coach_user_id is not null and attached_via in ('invite', 'directory')))
  ),
  constraint trainee_coach_relationship_not_self check (
    coach_user_id is null or coach_user_id <> trainee_user_id
  )
);

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise public.exercise_type not null,
  occurred_at timestamptz not null default timezone('utc', now()),
  good_form_reps integer not null check (good_form_reps >= 0),
  total_reps integer not null check (total_reps >= good_form_reps),
  form_score numeric(5, 2) not null check (form_score >= 0 and form_score <= 100),
  effort_score numeric(5, 2) not null check (effort_score >= 0 and effort_score <= 100),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  session_classification text,
  branding_source public.branding_source not null,
  coach_id uuid references public.profiles(id) on delete set null,
  coach_display_name text,
  coach_booking_url text,
  accent_color text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint workouts_branding_snapshot_validity check (
    ((branding_source = 'app' and coach_id is null and coach_display_name is null and coach_booking_url is null)
      or (branding_source = 'coach' and coach_id is not null and coach_display_name is not null))
  )
);

create index workouts_user_occurred_at_idx
  on public.workouts (user_id, occurred_at desc);

create index coach_directory_settings_public_idx
  on public.coach_directory_settings (application_status, visibility_enabled);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_user_has_role(target_role public.user_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = target_role
  );
$$;

revoke all on function public.current_user_has_role(public.user_role) from public;
grant execute on function public.current_user_has_role(public.user_role) to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  derived_user_name text;
begin
  derived_user_name := coalesce(
    nullif(new.raw_user_meta_data ->> 'user_name', ''),
    split_part(coalesce(new.email, new.id::text), '@', 1) || '-' || substr(new.id::text, 1, 8)
  );

  insert into public.profiles (
    id,
    user_name,
    email,
    first_name,
    last_name,
    nationality,
    city,
    region,
    is_age_confirmed
  )
  values (
    new.id,
    derived_user_name,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'first_name', ''),
    nullif(new.raw_user_meta_data ->> 'last_name', ''),
    nullif(new.raw_user_meta_data ->> 'nationality', ''),
    nullif(new.raw_user_meta_data ->> 'city', ''),
    nullif(new.raw_user_meta_data ->> 'region', ''),
    coalesce((new.raw_user_meta_data ->> 'is_age_confirmed')::boolean, false)
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'trainee')
  on conflict do nothing;

  insert into public.trainee_coach_relationships (trainee_user_id, coach_user_id, attached_via)
  values (new.id, null, 'none')
  on conflict (trainee_user_id) do nothing;

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger coach_profiles_set_updated_at
before update on public.coach_profiles
for each row execute function public.set_updated_at();

create trigger coach_business_profiles_set_updated_at
before update on public.coach_business_profiles
for each row execute function public.set_updated_at();

create trigger coach_directory_settings_set_updated_at
before update on public.coach_directory_settings
for each row execute function public.set_updated_at();

create trigger trainee_coach_relationships_set_updated_at
before update on public.trainee_coach_relationships
for each row execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.coach_profiles enable row level security;
alter table public.coach_business_profiles enable row level security;
alter table public.coach_applications enable row level security;
alter table public.coach_directory_settings enable row level security;
alter table public.trainee_coach_relationships enable row level security;
alter table public.workouts enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant select on public.user_roles to authenticated;
grant select on public.coach_profiles to anon, authenticated;
grant select on public.coach_business_profiles to anon, authenticated;
grant select, insert, update on public.coach_applications to authenticated;
grant select, update on public.coach_directory_settings to authenticated;
grant select, insert, update on public.trainee_coach_relationships to authenticated;
grant select, insert, update on public.workouts to authenticated;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_public_directory_select"
  on public.profiles
  for select
  using (
    exists (
      select 1
      from public.coach_directory_settings cds
      where cds.user_id = profiles.id
        and cds.application_status = 'approved'
        and cds.visibility_enabled = true
    )
  );

create policy "user_roles_select_own"
  on public.user_roles
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "user_roles_admin_select_all"
  on public.user_roles
  for select
  to authenticated
  using (public.current_user_has_role('admin'));

create policy "coach_profiles_select_own"
  on public.coach_profiles
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "coach_profiles_update_own"
  on public.coach_profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "coach_profiles_public_directory_select"
  on public.coach_profiles
  for select
  using (
    exists (
      select 1
      from public.coach_directory_settings cds
      where cds.user_id = coach_profiles.user_id
        and cds.application_status = 'approved'
        and cds.visibility_enabled = true
    )
  );

create policy "coach_business_profiles_select_own"
  on public.coach_business_profiles
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "coach_business_profiles_update_own"
  on public.coach_business_profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "coach_business_profiles_public_directory_select"
  on public.coach_business_profiles
  for select
  using (
    exists (
      select 1
      from public.coach_directory_settings cds
      where cds.user_id = coach_business_profiles.user_id
        and cds.application_status = 'approved'
        and cds.visibility_enabled = true
    )
  );

create policy "coach_applications_select_own"
  on public.coach_applications
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "coach_applications_insert_own"
  on public.coach_applications
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "coach_applications_admin_select_all"
  on public.coach_applications
  for select
  to authenticated
  using (public.current_user_has_role('admin'));

create policy "coach_applications_admin_update_all"
  on public.coach_applications
  for update
  to authenticated
  using (public.current_user_has_role('admin'))
  with check (public.current_user_has_role('admin'));

create policy "coach_directory_settings_select_own"
  on public.coach_directory_settings
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "coach_directory_settings_update_own"
  on public.coach_directory_settings
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "coach_directory_settings_public_visible_select"
  on public.coach_directory_settings
  for select
  using (application_status = 'approved' and visibility_enabled = true);

create policy "coach_directory_settings_admin_manage"
  on public.coach_directory_settings
  for update
  to authenticated
  using (public.current_user_has_role('admin'))
  with check (public.current_user_has_role('admin'));

create policy "trainee_coach_relationships_select_own"
  on public.trainee_coach_relationships
  for select
  to authenticated
  using (trainee_user_id = auth.uid());

create policy "trainee_coach_relationships_insert_own"
  on public.trainee_coach_relationships
  for insert
  to authenticated
  with check (trainee_user_id = auth.uid());

create policy "trainee_coach_relationships_update_own"
  on public.trainee_coach_relationships
  for update
  to authenticated
  using (trainee_user_id = auth.uid())
  with check (trainee_user_id = auth.uid());

create policy "workouts_select_own"
  on public.workouts
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "workouts_insert_own"
  on public.workouts
  for insert
  to authenticated
  with check (user_id = auth.uid());
