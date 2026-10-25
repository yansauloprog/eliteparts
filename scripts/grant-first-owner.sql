-- Run ONLY through Supabase SQL Editor / privileged backend, after inviting the real owner.
-- Replace both placeholders with the verified user's UUID and real e-mail.
-- No password is created here. No public RPC can assign this role.
begin;
do $$
declare target_id uuid := 'REPLACE_WITH_REAL_USER_UUID'::uuid;
        target_email text := 'REPLACE_WITH_VERIFIED_EMAIL';
begin
  if not exists(select 1 from auth.users where id=target_id and lower(email)=lower(target_email) and email_confirmed_at is not null) then
    raise exception 'The verified owner account was not found. No roles changed.';
  end if;
  update auth.users
  set raw_app_meta_data=coalesce(raw_app_meta_data,'{}'::jsonb)||'{"eliteparts_role":"owner"}'::jsonb
  where id=target_id and lower(email)=lower(target_email);
end $$;
commit;
-- The user must sign out and sign in again to refresh JWT claims.
