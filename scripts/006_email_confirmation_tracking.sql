-- Add email confirmation tracking to profiles table
-- and create triggers to sync with Supabase auth system

-- Add email_confirmed_at column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_confirmed_at timestamp with time zone;

-- Function to handle email confirmation updates
create or replace function public.handle_email_confirmation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Update the profile when email is confirmed in auth.users
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles 
    set 
      email_confirmed_at = new.email_confirmed_at,
      updated_at = timezone('utc'::text, now())
    where id = new.id;
  end if;

  return new;
end;
$$;

-- Trigger to sync email confirmation status
drop trigger if exists on_auth_user_email_confirmed on auth.users;

create trigger on_auth_user_email_confirmed
  after update on auth.users
  for each row
  when (old.email_confirmed_at is distinct from new.email_confirmed_at)
  execute function public.handle_email_confirmation();

-- Function to verify email confirmation status
create or replace function public.verify_email_confirmation(user_id uuid)
returns table(
  user_confirmed boolean,
  profile_confirmed boolean,
  confirmed_at timestamp with time zone,
  needs_sync boolean
)
language plpgsql
security definer
as $$
declare
  auth_confirmed_at timestamp with time zone;
  profile_confirmed_at timestamp with time zone;
begin
  -- Get confirmation status from auth.users
  select email_confirmed_at into auth_confirmed_at
  from auth.users
  where id = user_id;

  -- Get confirmation status from profiles
  select email_confirmed_at into profile_confirmed_at
  from public.profiles
  where id = user_id;

  return query select
    auth_confirmed_at is not null as user_confirmed,
    profile_confirmed_at is not null as profile_confirmed,
    coalesce(auth_confirmed_at, profile_confirmed_at) as confirmed_at,
    (auth_confirmed_at is not null and profile_confirmed_at is null) as needs_sync;
end;
$$;

-- Grant permissions
grant execute on function public.verify_email_confirmation(uuid) to authenticated;
grant execute on function public.verify_email_confirmation(uuid) to service_role;
