-- Anonymous sessions (every dashboard visitor uses one; see
-- dashboard/lib/supabase/ensure-user.ts) have no email. app_user requires a
-- non-null, unique email and name, so on_auth_user_created's insert failed
-- for every anonymous sign-in, rolling back the whole auth.users insert and
-- surfacing as "Database error creating anonymous user". app_user profiles
-- are not read anywhere in current application code (see migration
-- 20261020020000), so skip profile creation for anonymous users instead of
-- trying to give them one.
create or replace function public.create_operator_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    if new.is_anonymous then
        return new;
    end if;

    insert into public.app_user (auth_user_id, name, email)
    values (
        new.id,
        coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
        new.email
    );
    return new;
end;
$$;
