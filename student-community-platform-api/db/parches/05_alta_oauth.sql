-- =====================================================================
--  PARCHE 2 — Alta correcta cuando el correo ya viene confirmado
--  Comunidad UTHH · El Aula Informa
--
--  POR QUÉ
--  Hay dos formas en que Supabase da de alta una cuenta:
--
--   a) Código/enlace por correo: primero INSERTA el usuario sin confirmar
--      y después ACTUALIZA email_confirmed_at cuando el alumno abre el
--      enlace. Ahí se dispara fn_auth_sincronizar y el rol sube a
--      verificado. Este camino ya funcionaba.
--
--   b) Proveedor externo (Google/Microsoft) o alta manual con "Auto
--      Confirm": el usuario se INSERTA con email_confirmed_at ya puesto.
--      No hay UPDATE, así que fn_auth_sincronizar nunca corre y la cuenta
--      se queda en no_verificado — es decir, en SOLO LECTURA — hasta su
--      segundo inicio de sesión.
--
--  Como el correo institucional de la UTHH es Google Workspace y se va a
--  usar inicio de sesión con Google, el caso (b) sería el normal para
--  casi todos los alumnos. Esta función corrige eso: al crear la fila en
--  usuarios ya toma en cuenta si el correo viene confirmado desde el
--  INSERT.
--
--  Ejecutar completo en el SQL Editor, con el rol postgres.
-- =====================================================================

create or replace function fn_auth_crear_usuario() returns trigger
language plpgsql security definer set search_path = public, privado, extensions as $$
begin
  insert into usuarios (id, alias, rol, correo_confirmado_en, ultimo_acceso_en)
  values (
    new.id,
    -- Alias público aleatorio. Nunca se deriva del correo: si el correo
    -- institucional lleva la matrícula, derivarlo identificaría al alumno.
    ('alumno_' || encode(extensions.gen_random_bytes(4), 'hex'))::extensions.citext,
    -- Si Supabase ya confirmó el correo en el propio INSERT (Google,
    -- Microsoft o alta manual con Auto Confirm), la cuenta nace verificada.
    -- Si no, nace no verificada y fn_auth_sincronizar la sube cuando el
    -- alumno abra el enlace de su correo.
    case
      when new.email_confirmed_at is not null then 'verificado'::rol_usuario
      else 'no_verificado'::rol_usuario
    end,
    new.email_confirmed_at,
    new.last_sign_in_at
  )
  on conflict (id) do nothing;

  insert into privado.identidades (usuario_id)
  values (new.id)
  on conflict (usuario_id) do nothing;

  return new;
end $$;

-- ---------------------------------------------------------------------
--  Corrección de las cuentas que ya existan mal (si las hubiera)
--  Sube a verificado a quien tenga el correo confirmado en Auth pero
--  siga marcado como no verificado en usuarios.
-- ---------------------------------------------------------------------
update usuarios u
   set rol                  = 'verificado',
       correo_confirmado_en = coalesce(u.correo_confirmado_en, a.email_confirmed_at)
  from auth.users a
 where a.id = u.id
   and a.email_confirmed_at is not null
   and u.rol = 'no_verificado'
   and u.eliminado_en is null;

-- ---------------------------------------------------------------------
--  Verificación: no debe quedar nadie confirmado en Auth y no verificado aquí
-- ---------------------------------------------------------------------
select
  (select count(*) from usuarios)                                    as usuarios,
  (select count(*) from usuarios where rol = 'verificado')           as verificados,
  (select count(*)
     from usuarios u join auth.users a on a.id = u.id
    where a.email_confirmed_at is not null and u.rol = 'no_verificado') as inconsistentes;
