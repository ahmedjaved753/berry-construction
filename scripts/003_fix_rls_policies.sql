-- Fix infinite recursion in RLS policies by removing problematic admin policy
-- and using a simpler approach

-- Drop the problematic admin policy that causes infinite recursion
drop policy if exists "Admins can view all profiles" on public.profiles;

-- Create a simpler admin policy using auth.jwt() claims instead of querying profiles table
-- This avoids the circular dependency
create policy "Admins can view all profiles via JWT"
  on public.profiles for select
  using (
    (auth.jwt() ->> 'role')::text = 'admin'
    or auth.uid() = id
  );

-- Also add admin policies for update and delete operations
create policy "Admins can update all profiles"
  on public.profiles for update
  using (
    (auth.jwt() ->> 'role')::text = 'admin'
    or auth.uid() = id
  );

create policy "Admins can delete profiles"
  on public.profiles for delete
  using ((auth.jwt() ->> 'role')::text = 'admin');
