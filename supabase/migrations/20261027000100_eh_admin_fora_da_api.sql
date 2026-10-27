-- eh_admin só serve às policies; fora do schema public ela não aparece na API.
create schema if not exists privado;
grant usage on schema privado to authenticated;
alter function public.eh_admin() set schema privado;
