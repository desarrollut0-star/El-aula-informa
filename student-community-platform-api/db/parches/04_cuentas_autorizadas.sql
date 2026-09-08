-- =====================================================================
--  PARCHE 1 — Cuentas autorizadas fuera del dominio institucional
--  Comunidad UTHH · El Aula Informa
--
--  POR QUÉ
--  La cuenta «Sociedad Estudiantil» la opera el equipo del proyecto, no
--  un alumno: su correo es una cuenta de servicio del equipo, no
--  institucional. En vez de quitar la validación de dominio (que es la
--  barrera contra cuentas falsas), se agrega una lista blanca corta y
--  auditable: se sabe exactamente qué correos no institucionales pueden
--  existir y por qué.
--
--  Además corrige la llave de usuarios → auth.users para que borrar una
--  cuenta desde el panel de Supabase funcione. Hoy la llave no tiene
--  ON DELETE, así que Supabase no puede borrar un usuario que ya tenga
--  su fila en usuarios (falla con un error genérico).
--
--  Ejecutar completo en el SQL Editor, con el rol postgres.
-- =====================================================================


-- ---------------------------------------------------------------------
--  1. Lista blanca de correos no institucionales
--  Vive en el esquema privado: contiene correos, que son datos
--  identificables y no se exponen por ninguna API.
-- ---------------------------------------------------------------------
create table if not exists privado.cuentas_autorizadas (
  correo         text        primary key check (correo = lower(correo)),
  motivo         text        not null,          -- por qué se autoriza
  autorizada_por text,                          -- quién del equipo la dio de alta
  creado_en      timestamptz not null default now()
);

comment on table privado.cuentas_autorizadas is
  'Correos fuera del dominio institucional que pueden tener cuenta (cuentas de servicio del equipo). Lista corta y auditable.';

-- RLS y permisos: el esquema privado no lo cubre el "automatic RLS" de
-- Supabase (que solo actúa sobre public), así que se hace explícito.
alter table privado.cuentas_autorizadas enable row level security;

drop policy if exists backend_todo on privado.cuentas_autorizadas;
create policy backend_todo on privado.cuentas_autorizadas
  for all to app_backend using (true) with check (true);

grant select, insert, update, delete on privado.cuentas_autorizadas to app_backend;


-- ---------------------------------------------------------------------
--  2. Validación de alta: dominio institucional O lista blanca
--  Se mantiene la regla general (solo @uthh.edu.mx) y se permite la
--  excepción solo si el correo está explícitamente autorizado.
-- ---------------------------------------------------------------------
create or replace function fn_auth_validar_dominio() returns trigger
language plpgsql security definer set search_path = public, privado as $$
declare
  -- Prefijo v_ a propósito: si la variable se llamara "correo" chocaría
  -- con la columna del mismo nombre en cuentas_autorizadas.
  v_correo text := lower(coalesce(new.email, ''));
begin
  -- Caso normal: alumno con correo institucional.
  if v_correo like '%@uthh.edu.mx' then
    return new;
  end if;

  -- Excepción explícita: cuenta de servicio del equipo.
  if exists (select 1 from privado.cuentas_autorizadas c where c.correo = v_correo) then
    return new;
  end if;

  raise exception 'Solo se admite el correo institucional (@uthh.edu.mx)';
end $$;


-- ---------------------------------------------------------------------
--  3. Autorizar la cuenta del equipo de desarrollo
--  ⚠ Cambia el correo si usan otro. Debe ir en minúsculas.
-- ---------------------------------------------------------------------
insert into privado.cuentas_autorizadas (correo, motivo, autorizada_por)
values (
  'desarrollut.0@gmail.com',
  'Cuenta compartida del equipo de desarrollo; opera la cuenta «Sociedad Estudiantil»',
  'Pedro Rubio Angeles'
)
on conflict (correo) do nothing;


-- ---------------------------------------------------------------------
--  4. Permitir borrar una cuenta desde el panel de Supabase
--  Con ON DELETE CASCADE, borrar el usuario en Authentication → Users
--  borra también su fila en usuarios. Sigue protegido: si esa persona ya
--  publicó algo, contenidos.autor_id es ON DELETE RESTRICT y el borrado
--  se bloquea — para esos casos existe anonimizar_usuario().
-- ---------------------------------------------------------------------
alter table usuarios drop constraint usuarios_id_fkey;

alter table usuarios add constraint usuarios_id_fkey
  foreign key (id) references auth.users (id) on delete cascade;


-- ---------------------------------------------------------------------
--  5. Verificación
-- ---------------------------------------------------------------------
select
  (select count(*) from privado.cuentas_autorizadas)                    as correos_autorizados,
  (select pg_get_constraintdef(oid) from pg_constraint
    where conrelid = 'usuarios'::regclass and conname = 'usuarios_id_fkey') as llave_usuarios;
