-- Ensure profile exists for authenticated users
-- This is a fallback in case the trigger didn't create the profile

-- Function to create missing profiles
create or replace function public.ensure_profile_exists(user_id uuid, user_email text)
returns void
language plpgsql
security definer
as $$
begin
  -- Check if profile exists, if not create it
  insert into public.profiles (id, email, full_name, role)
  values (
    user_id,
    user_email,
    '',
    'user'
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = timezone('utc'::text, now());
end;
$$;

-- Grant necessary permissions
grant execute on function public.ensure_profile_exists(uuid, text) to authenticated;
grant execute on function public.ensure_profile_exists(uuid, text) to service_role;
