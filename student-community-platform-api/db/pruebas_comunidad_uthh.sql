-- =====================================================================
--  PRUEBAS DE COMPORTAMIENTO — Comunidad UTHH · El Aula Informa (v2)
--  Ejecutar DESPUÉS de comunidad_uthh.sql, en una base de PRUEBA (no en
--  producción: inserta datos de ejemplo). Cada "debe_fallar" muestra que
--  la base rechaza lo que debe rechazar; cada línea de texto muestra el
--  valor obtenido y el esperado.
--
--  En Supabase, las tres cuentas del paso 1 conviene crearlas desde
--  Authentication → Users (con esos correos) en vez del INSERT directo,
--  y sustituir los uuid de abajo por los que Supabase genere.
--  Resultado esperado: todas las líneas con ✅ y ningún ❌.
--  Esta versión incluye los grupos 11 y 12, que cubren los dos parches
--  aplicados durante la instalación real (lista blanca y alta por Google).
-- =====================================================================

-- Ayudante: ejecuta una sentencia que DEBE fallar y muestra el motivo.
create or replace function debe_fallar(sentencia text) returns text language plpgsql as $$
begin
  execute sentencia;
  return '❌ NO FALLÓ (mal): ' || left(sentencia, 70);
exception when others then
  return '✅ falló como se esperaba: ' || sqlerrm;
end $$;

-- 1) Auth: dominio institucional y creación automática de usuarios
select debe_fallar($$insert into auth.users (email) values ('pedro@gmail.com')$$);
insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111', 'alumno1@uthh.edu.mx');
insert into auth.users (id, email) values ('22222222-2222-2222-2222-222222222222', 'sociedad@uthh.edu.mx');
insert into auth.users (id, email) values ('33333333-3333-3333-3333-333333333333', 'alumno2@uthh.edu.mx');
select 'usuarios creados por trigger: ' || count(*) || ' · alias ejemplo: ' || min(alias::text) || ' · identidades: ' || (select count(*) from privado.identidades) from usuarios;
update auth.users set email_confirmed_at = now(), last_sign_in_at = now();
select 'roles tras confirmar: ' || string_agg(distinct rol::text, ',') || ' (esperado: verificado)' from usuarios;
update usuarios set alias = 'Sociedad Estudiantil', es_cuenta_oficial = true where id = '22222222-2222-2222-2222-222222222222';
update usuarios set programa_id = (select id from programas where clave = 'IDGS') where id = '11111111-1111-1111-1111-111111111111';

-- 2) Contenidos: reglas por tipo y cuenta oficial
insert into contenidos (id, tipo, autor_id, programa_id, cuerpo, es_anonimo) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'testimonio', '11111111-1111-1111-1111-111111111111', (select id from programas where clave='IDGS'), 'Soy de IDGS y este paro me hace perder dinero de mi renta.', true);
select debe_fallar($$insert into contenidos (tipo, autor_id, titulo, cuerpo) values ('testimonio', '11111111-1111-1111-1111-111111111111', 'con titulo', 'x')$$);
select debe_fallar($$insert into contenidos (tipo, autor_id, titulo, cuerpo) values ('evento', '11111111-1111-1111-1111-111111111111', 'Marcha', 'sin fecha')$$);
select debe_fallar($$insert into contenidos (tipo, autor_id, titulo, cuerpo) values ('aviso', '11111111-1111-1111-1111-111111111111', 'Aviso falso', 'un alumno normal no puede')$$);
insert into contenidos (id, tipo, autor_id, titulo, cuerpo, fijado) values ('aaaaaaaa-0000-0000-0000-000000000002', 'aviso', '22222222-2222-2222-2222-222222222222', 'Asamblea general', 'Viernes 12:00 en la explanada', true);
insert into contenidos (id, tipo, autor_id, titulo, cuerpo, fecha_evento, lugar) values ('aaaaaaaa-0000-0000-0000-000000000003', 'evento', '22222222-2222-2222-2222-222222222222', 'Asamblea general', 'Orden del día adjunto', now() + interval '3 days', 'Explanada');
insert into contenidos (id, tipo, autor_id, titulo, cuerpo, cierra_en) values ('aaaaaaaa-0000-0000-0000-000000000004', 'encuesta', '11111111-1111-1111-1111-111111111111', '¿Marchamos el viernes?', 'Vota', now() + interval '2 days');
insert into contenidos (id, tipo, autor_id, titulo, cuerpo, estado) values ('aaaaaaaa-0000-0000-0000-000000000005', 'denuncia', '11111111-1111-1111-1111-111111111111', 'Cobro indebido', 'Nos cobraron una cuota que no existe en el reglamento, con recibo sin folio.', 'en_revision');

-- 3) Reacciones: contadores, cambio de opinión y quitar
insert into reacciones values ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', true);
insert into reacciones values ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000001', false);
insert into reacciones values ('33333333-3333-3333-3333-333333333333', 'aaaaaaaa-0000-0000-0000-000000000001', true)
  on conflict (usuario_id, contenido_id) do update set a_favor = excluded.a_favor;
select 'reacciones → apoyos=' || total_apoyos || ' rechazos=' || total_rechazos || ' (esperado 2 y 0)' from contenidos where id = 'aaaaaaaa-0000-0000-0000-000000000001';
delete from reacciones where usuario_id = '33333333-3333-3333-3333-333333333333';
select 'tras quitar una → apoyos=' || total_apoyos || ' (esperado 1)' from contenidos where id = 'aaaaaaaa-0000-0000-0000-000000000001';

-- 4) Reportes: uno por persona y exactamente un objetivo
insert into reportes_contenido (contenido_id, reportado_por, motivo) values ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'spam');
select debe_fallar($$insert into reportes_contenido (contenido_id, reportado_por, motivo) values ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'ofensivo')$$);
select debe_fallar($$insert into reportes_contenido (reportado_por, motivo) values ('33333333-3333-3333-3333-333333333333', 'spam')$$);
select 'total_reportes=' || total_reportes || ' (esperado 1)' from contenidos where id = 'aaaaaaaa-0000-0000-0000-000000000001';

-- 5) Etiquetas: slug automático y unicidad
insert into etiquetas (nombre) values ('#Gasto De Renta');
select 'slug generado: ' || slug || ' / nombre: ' || nombre || ' (esperado gastoderenta)' from etiquetas;
select debe_fallar($$insert into etiquetas (nombre) values ('gastoderenta')$$);
insert into contenido_etiquetas values ('aaaaaaaa-0000-0000-0000-000000000001', (select id from etiquetas limit 1));
select 'total_usos=' || total_usos || ' (esperado 1)' from etiquetas;

-- 6) Encuesta: opciones, voto único, opción de otra encuesta
insert into encuesta_opciones (id, contenido_id, texto, orden) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000004', 'Sí', 1),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000004', 'No', 2);
select debe_fallar($$insert into encuesta_opciones (contenido_id, texto, orden) values ('aaaaaaaa-0000-0000-0000-000000000001', 'opción en un testimonio', 1)$$);
insert into encuesta_votos (contenido_id, usuario_id, opcion_id) values ('aaaaaaaa-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0000-0000-0000-000000000001');
select debe_fallar($$insert into encuesta_votos (contenido_id, usuario_id, opcion_id) values ('aaaaaaaa-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-0000-0000-0000-000000000002')$$);
select 'votos opción Sí=' || total_votos || ' (esperado 1)' from encuesta_opciones where id = 'bbbbbbbb-0000-0000-0000-000000000001';

-- 7) Asambleas y denuncias solo sobre su tipo; testigos
select debe_fallar($$insert into asambleas (contenido_id, orden_del_dia) values ('aaaaaaaa-0000-0000-0000-000000000001', 'sobre un testimonio')$$);
insert into asambleas (contenido_id, orden_del_dia) values ('aaaaaaaa-0000-0000-0000-000000000003', '1. Informe 2. Votación');
insert into denuncias (contenido_id, categoria_id) values ('aaaaaaaa-0000-0000-0000-000000000005', (select id from categorias_denuncia where clave = 'recursos'));
insert into denuncia_confirmaciones values ('aaaaaaaa-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333333');
select 'confirmaciones=' || total_confirmaciones || ' (esperado 1)' from denuncias;

-- 8) Archivos: evidencia privada, adjuntos limitados, tamaño
select debe_fallar($$insert into archivos (public_id, version, formato, recurso, entrega, bytes, uso) values ('aula/evidencias/x', 1, 'jpg', 'image', 'upload', 1000, 'evidencia')$$);
insert into archivos (id, public_id, version, formato, recurso, entrega, bytes, uso, subido_por) values ('cccccccc-0000-0000-0000-000000000001', 'aula/evidencias/x', 1, 'jpg', 'image', 'private', 1000, 'evidencia', '11111111-1111-1111-1111-111111111111');
insert into denuncia_evidencia (denuncia_id, archivo_id) values ('aaaaaaaa-0000-0000-0000-000000000005', 'cccccccc-0000-0000-0000-000000000001');
insert into archivos (id, public_id, version, formato, recurso, bytes, uso) select gen_random_uuid(), 'aula/contenidos/' || g, 1, 'webp', 'image', 2000, 'portada_contenido' from generate_series(1,4) g;
select debe_fallar($$insert into contenido_adjuntos (contenido_id, archivo_id) values ('aaaaaaaa-0000-0000-0000-000000000001', (select id from archivos where uso='portada_contenido' limit 1))$$);
insert into contenido_adjuntos (contenido_id, archivo_id, orden) select 'aaaaaaaa-0000-0000-0000-000000000002', id, row_number() over () from (select id from archivos where uso='portada_contenido' limit 3) s;
select debe_fallar($$insert into contenido_adjuntos (contenido_id, archivo_id, orden) values ('aaaaaaaa-0000-0000-0000-000000000002', (select id from archivos where uso='portada_contenido' order by public_id desc limit 1), 4)$$);
select debe_fallar($$insert into archivos (public_id, version, formato, recurso, bytes, uso) values ('grande', 1, 'jpg', 'image', 9000000, 'portada_contenido')$$);

-- 9) Ranking, vistas, huérfanos, purga y anonimización
select 'recalcular_ranking → ' || recalcular_ranking() || ' filas (esperado 4)';
select 'vista_muro: ' || count(*) || ' visibles · anónimos con alias null: ' || count(*) filter (where es_anonimo and autor_alias is null) || ' (esperado 4 y 1)' from vista_muro;
select 'cola moderación: ' || count(*) || ' (esperado 1: la denuncia en revisión)' from vista_cola_moderacion;
select clave || ' firmas=' || total_firmas || ' pct=' || porcentaje from vista_estadisticas_programa where clave = 'IDGS';
select 'huérfanos (esperado 0, todo tiene menos de 24 h): ' || count(*) from archivos_huerfanos();
select 'purgar_antiguos → ' || purgar_antiguos() || ' (esperado 0)';
select anonimizar_usuario('11111111-1111-1111-1111-111111111111');
select 'anonimizado: alias=' || alias || ' rol=' || rol || ' · contenidos anónimos=' || (select count(*) from contenidos where autor_id = '11111111-1111-1111-1111-111111111111' and es_anonimo) || ' (esperado 3)' from usuarios where id = '11111111-1111-1111-1111-111111111111';

-- 10) RLS en todo y acceso del rol backend
select 'tablas sin RLS: ' || count(*) filter (where not rowsecurity) || ' de ' || count(*) || ' (esperado 0)' from pg_tables where schemaname in ('public','privado');
set role app_backend;
select 'como app_backend veo ' || count(*) || ' contenidos y ' || (select count(*) from privado.identidades) || ' identidades' from contenidos;
reset role;


-- =====================================================================
--  11) LISTA BLANCA DE CORREOS (parche 1)
--  La validación de dominio sigue vigente; la excepción es explícita.
-- =====================================================================
select '11.1 ' || debe_fallar($$insert into auth.users (email) values ('cualquiera@gmail.com')$$);

insert into auth.users (id, email) values ('cccc3333-0000-0000-0000-000000000001', 'desarrollut.0@gmail.com');
select '11.2 gmail autorizado aceptado -> usuarios con ese id = '
    || (select count(*) from usuarios where id = 'cccc3333-0000-0000-0000-000000000001') || ' (esperado 1)';

-- el mismo correo escrito con mayúsculas también se reconoce
insert into auth.users (id, email) values ('cccc3333-0000-0000-0000-000000000002', 'DESARROLLUT.0@Gmail.COM');
select '11.3 mismo correo en mayúsculas aceptado -> usuarios con ese id = '
    || (select count(*) from usuarios where id = 'cccc3333-0000-0000-0000-000000000002') || ' (esperado 1)';
delete from auth.users where id = 'cccc3333-0000-0000-0000-000000000002';


-- =====================================================================
--  12) ALTA CON EL CORREO YA CONFIRMADO (parche 2)
--  Es el camino de Google/Microsoft y el de "Auto Confirm" del panel.
--  Sin el parche, estas cuentas quedaban en SOLO LECTURA hasta su
--  segundo inicio de sesión.
-- =====================================================================
insert into auth.users (id, email, email_confirmed_at, last_sign_in_at)
values ('cccc3333-0000-0000-0000-000000000003', 'porgoogle@uthh.edu.mx', now(), now());
select '12.1 alta tipo Google -> rol = ' || rol || ' (esperado verificado)'
  from usuarios where id = 'cccc3333-0000-0000-0000-000000000003';

insert into auth.users (id, email) values ('cccc3333-0000-0000-0000-000000000004', 'porcorreo@uthh.edu.mx');
select '12.2 alta por código, antes de confirmar -> rol = ' || rol || ' (esperado no_verificado)'
  from usuarios where id = 'cccc3333-0000-0000-0000-000000000004';
update auth.users set email_confirmed_at = now() where id = 'cccc3333-0000-0000-0000-000000000004';
select '12.3 tras confirmar -> rol = ' || rol || ' (esperado verificado)'
  from usuarios where id = 'cccc3333-0000-0000-0000-000000000004';

-- Se excluyen las cuentas dadas de baja voluntariamente: esas deben
-- quedar en no_verificado aunque su correo siga confirmado en Auth.
select '12.4 nadie confirmado en Auth se quedó sin verificar: ' ||
       (select count(*) from usuarios u join auth.users a on a.id = u.id
         where a.email_confirmed_at is not null
           and u.rol = 'no_verificado'
           and u.eliminado_en is null) || ' (esperado 0)';


-- =====================================================================
--  13) BORRADO DE CUENTAS
--  Con ON DELETE CASCADE se puede borrar desde el panel de Supabase,
--  pero sigue protegido si esa cuenta ya publicó algo.
-- =====================================================================
delete from auth.users where id = 'cccc3333-0000-0000-0000-000000000004';
select '13.1 borrar cuenta sin contenido -> quedan ' ||
       (select count(*) from usuarios where id = 'cccc3333-0000-0000-0000-000000000004') || ' filas (esperado 0)';

select '13.2 ' || debe_fallar($$delete from auth.users where id = '11111111-1111-1111-1111-111111111111'$$)
    || '  ← la cuenta que ya publicó no se puede borrar; se anonimiza';


drop function debe_fallar(text);
