-- =====================================================================
--  COMUNIDAD UTHH · EL AULA INFORMA — BASE DE DATOS COMPLETA
--  PostgreSQL 15+ en Supabase · versión 2.0 · 6 de septiembre de 2026
--  Incluye los dos parches aplicados durante la instalación real.
-- =====================================================================
--
--  CÓMO EJECUTARLO
--  1. Abre el proyecto en Supabase → SQL Editor → New query.
--  2. Pega este archivo completo y ejecútalo (Run) con el rol postgres.
--     Está pensado para una base VACÍA; si necesitas empezar de cero,
--     corre primero el bloque "LIMPIEZA TOTAL" que está al final (comentado).
--  3. Al terminar, revisa la sección 9 (SEGURIDAD): cambia la contraseña
--     del rol app_backend y desactiva la Data API en Settings → API.
--
--  QUÉ CONTIENE, EN ORDEN
--  1. Extensiones y esquemas
--  2. Tipos enumerados (enums)
--  3. Tablas (29 instaladas) en orden de dependencia, con sus índices
--  4. Vistas (3)
--  5. Funciones y triggers (contadores, ranking, validaciones)
--  6. Integración con Supabase Auth (variante A, la del diagrama)
--  7. Datos semilla (programas, categorías, palabras bloqueadas)
--  8. Variante B: enlace mágico propio (sesiones, tokens) — comentada
--  9. Seguridad: rol app_backend, RLS y políticas
--  10. Limpieza total — comentada
--
--  CONVENCIONES
--  · uuid como llave primaria (gen_random_uuid()), timestamptz siempre.
--  · Nombres en español y snake_case, igual que el código del backend.
--  · Las reglas de negocio (umbrales, eventos) viven en el Worker;
--    la base garantiza integridad, unicidad y contadores.
-- =====================================================================


-- =====================================================================
--  1. EXTENSIONES Y ESQUEMAS
-- =====================================================================

-- Supabase guarda las extensiones en el esquema "extensions".
-- Si corres esto fuera de Supabase, la siguiente línea lo crea.
create schema if not exists extensions;

-- pgcrypto : cifrado opcional (pgp_sym_encrypt) y funciones hash.
-- citext   : texto que no distingue mayúsculas (para el alias único).
-- unaccent : quitar acentos (para el slug de las etiquetas).
-- pg_trgm  : búsqueda por trigramas (autocompletado de etiquetas).
create extension if not exists pgcrypto  with schema extensions;
create extension if not exists citext    with schema extensions;
create extension if not exists unaccent  with schema extensions;
create extension if not exists pg_trgm   with schema extensions;

-- Esquema "privado": aquí vive lo que identifica a una persona
-- (liga con el padrón). NO se expone por la Data API; solo lo lee el Worker.
create schema if not exists privado;

comment on schema privado is
  'Datos que identifican a una persona (padrón, liga alumno-matrícula). Nunca exponer por la API.';


-- =====================================================================
--  2. TIPOS ENUMERADOS
--  Un enum es una lista cerrada de valores. Cambiarla requiere una
--  migración: eso es a propósito (roles y estados no cambian a diario).
--  Lo que el equipo sí edita seguido (programas, categorías, palabras
--  bloqueadas) va en tablas, no en enums.
-- =====================================================================

create type rol_usuario                as enum ('no_verificado', 'verificado');
create type estatus_padron             as enum ('activo', 'baja');
create type nivel_educativo            as enum ('tsu', 'ingenieria', 'licenciatura');
create type tipo_contenido             as enum ('testimonio', 'aviso', 'evento', 'novedad', 'propuesta', 'encuesta', 'denuncia');
create type estado_contenido           as enum ('visible', 'en_revision', 'oculto', 'rechazado');
create type nivel_impacto              as enum ('bajo', 'medio', 'alto');
create type motivo_reporte             as enum ('spam', 'ofensivo', 'datos_personales', 'informacion_falsa', 'otro');
create type accion_moderacion          as enum ('ocultado_automatico', 'ocultado_por_reportes', 'ocultado_manual', 'aprobado', 'rechazado', 'restaurado');
create type estado_apelacion           as enum ('pendiente', 'aceptada', 'rechazada');
create type estado_evento_integracion  as enum ('pendiente', 'procesado', 'fallido');
create type modalidad_asamblea         as enum ('presencial', 'virtual', 'mixta');
create type estado_asamblea            as enum ('convocada', 'realizada', 'cancelada');
create type uso_archivo                as enum ('portada_contenido', 'foto_programa', 'evidencia');
create type entrega_archivo            as enum ('upload', 'private');


-- =====================================================================
--  3. TABLAS
--  Orden: primero las que no dependen de nadie, luego las que apuntan
--  a ellas. programas.imagen_id se agrega después de crear archivos
--  porque las dos tablas se apuntan mutuamente.
-- =====================================================================

-- ---------------------------------------------------------------------
--  3.1 programas — catálogo de programas educativos
--  Resultado: una fila por programa (ingenierías, licenciaturas y TSU).
--  Los TSU apuntan a su ingeniería/licenciatura con programa_continuidad_id
--  para poder agrupar todo en los 10 programas del tablero.
-- ---------------------------------------------------------------------
create table programas (
  id                      uuid            primary key default gen_random_uuid(),
  clave                   text            not null unique,              -- abreviatura estable: IDGS, TSU-TI…
  nombre                  text            not null,
  nivel                   nivel_educativo not null,
  programa_continuidad_id uuid            references programas (id) on delete set null,
  matricula_total         integer         not null default 0 check (matricula_total >= 0),
  activo                  boolean         not null default true,
  orden                   smallint        not null default 0,
  creado_en               timestamptz     not null default now()
);
create index programas_nivel_orden_idx on programas (nivel, orden);
comment on table programas is 'Catálogo de programas educativos; denominador del tablero y filtro del muro.';


-- ---------------------------------------------------------------------
--  3.2 usuarios — la cuenta tal como la ve el resto del sistema
--  Resultado: alias público, rol y programa. NO contiene correo ni
--  matrícula: puede aparecer en cualquier consulta sin exponer a nadie.
--  Con Supabase Auth, id es el mismo id de auth.users (ver sección 6).
-- ---------------------------------------------------------------------
create table usuarios (
  id                   uuid              primary key references auth.users (id) on delete cascade,
  alias                extensions.citext not null unique
                                         check (char_length(alias::text) between 3 and 40),
  rol                  rol_usuario       not null default 'no_verificado',
  programa_id          uuid              references programas (id) on delete set null,
  es_cuenta_oficial    boolean           not null default false,       -- true solo en «Sociedad Estudiantil»
  correo_confirmado_en timestamptz,                                    -- NULL = todavía no abrió el enlace
  acepto_terminos_en   timestamptz,                                    -- consentimiento LFPDPPP
  version_terminos     text,
  ultimo_acceso_en     timestamptz,
  eliminado_en         timestamptz,                                    -- baja voluntaria: se anonimiza, no se borra
  creado_en            timestamptz       not null default now(),
  actualizado_en       timestamptz       not null default now()
);
create index usuarios_rol_idx on usuarios (rol);
comment on table usuarios is 'Cuenta pública de la plataforma: alias, rol, programa. Sin correo ni matrícula.';


-- ---------------------------------------------------------------------
--  3.3 privado.cargas_padron — bitácora de cada importación del padrón
--  Resultado: sabes con qué lista oficial y cuándo se dio de baja a alguien.
-- ---------------------------------------------------------------------
create table privado.cargas_padron (
  id                     uuid        primary key default gen_random_uuid(),
  periodo                text        not null,                          -- p. ej. «sep–dic 2026»
  total_registros        integer     not null default 0,
  altas                  integer     not null default 0,
  bajas                  integer     not null default 0,
  hash_archivo           text,                                          -- SHA-256 del archivo oficial recibido
  cargado_por_usuario_id uuid        references usuarios (id) on delete set null,
  cargado_en             timestamptz not null default now()
);
comment on table privado.cargas_padron is 'Una fila por importación del listado oficial de inscritos.';


-- ---------------------------------------------------------------------
--  3.4 privado.padron_alumnos — estado de inscripción por alumno
--  Resultado: la matrícula existe solo como HMAC (calculado en el Worker
--  con una llave secreta). Un SHA-256 simple de 8 dígitos se revierte en
--  segundos; el HMAC no.
-- ---------------------------------------------------------------------
create table privado.padron_alumnos (
  id              uuid           primary key default gen_random_uuid(),
  matricula_hmac  text           not null unique,
  programa_id     uuid           references programas (id) on delete set null,
  estatus         estatus_padron not null default 'activo',
  ultima_carga_id uuid           references privado.cargas_padron (id) on delete set null,
  actualizado_en  timestamptz    not null default now()
);
create index padron_alumnos_estatus_idx on privado.padron_alumnos (estatus);
create index padron_alumnos_carga_idx   on privado.padron_alumnos (ultima_carga_id);
comment on table privado.padron_alumnos is 'Listado oficial de inscritos con la matrícula como HMAC.';


-- ---------------------------------------------------------------------
--  3.4b privado.cuentas_autorizadas — lista blanca de correos
--  Resultado: permite que existan cuentas de servicio del equipo (que no
--  tienen correo institucional) SIN debilitar la validación de dominio.
--  Corta y auditable: se sabe qué correo, por qué y quién lo autorizó.
-- ---------------------------------------------------------------------
create table privado.cuentas_autorizadas (
  correo         text        primary key check (correo = lower(correo)),
  motivo         text        not null,                          -- por qué se autoriza
  autorizada_por text,                                          -- quién del equipo la dio de alta
  creado_en      timestamptz not null default now()
);
comment on table privado.cuentas_autorizadas is
  'Correos fuera del dominio institucional que pueden tener cuenta (cuentas de servicio del equipo).';


-- ---------------------------------------------------------------------
--  3.5 privado.identidades — puente cuenta ↔ matrícula
--  Resultado: UNIQUE (padron_id) hace cumplir "una matrícula = una cuenta".
--  En la variante B (enlace mágico propio) se agrega correo_hmac.
-- ---------------------------------------------------------------------
create table privado.identidades (
  usuario_id          uuid        primary key references usuarios (id) on delete cascade,
  padron_id           uuid        unique references privado.padron_alumnos (id) on delete set null,
  vinculado_padron_en timestamptz,
  creado_en           timestamptz not null default now()
);
comment on table privado.identidades is 'Liga restringida entre la cuenta y su matrícula en el padrón.';


-- ---------------------------------------------------------------------
--  3.6 contenidos — LA TABLA CENTRAL: toda tarjeta del muro
--  Resultado: testimonios, avisos, eventos, novedades, propuestas,
--  encuestas y denuncias son filas aquí (columna tipo). Un solo feed,
--  un solo cursor (score, id), un solo estado de moderación.
-- ---------------------------------------------------------------------
create table contenidos (
  id                uuid             primary key default gen_random_uuid(),
  tipo              tipo_contenido   not null,
  autor_id          uuid             not null references usuarios (id) on delete restrict,  -- se anonimiza, no se borra
  programa_id       uuid             references programas (id) on delete set null,
  es_anonimo        boolean          not null default false,           -- por publicación, no por cuenta
  titulo            text             check (char_length(titulo) <= 140),
  cuerpo            text             not null check (char_length(cuerpo) between 1 and 4000),
  nivel             nivel_impacto    not null default 'medio',
  estado            estado_contenido not null default 'visible',
  fijado            boolean          not null default false,           -- solo la cuenta oficial
  fecha_evento      timestamptz,                                       -- obligatoria si tipo = evento
  lugar             text,
  cierra_en         timestamptz,                                       -- obligatoria si tipo = encuesta
  score             integer          not null default 0,               -- ranking ×1000 (recalcular_ranking)
  total_apoyos      integer          not null default 0,               -- triggers desde reacciones
  total_rechazos    integer          not null default 0,
  total_comentarios integer          not null default 0,
  total_reportes    integer          not null default 0,
  busqueda          tsvector         generated always as
                      (to_tsvector('spanish'::regconfig, coalesce(titulo, '') || ' ' || cuerpo)) stored,
  creado_en         timestamptz      not null default now(),
  actualizado_en    timestamptz      not null default now(),
  editado_en        timestamptz,

  -- Reglas por tipo: la base no deja guardar un evento sin fecha ni una
  -- encuesta sin cierre, ni un testimonio con título.
  constraint contenidos_titulo_por_tipo   check ((tipo = 'testimonio') = (titulo is null)),
  constraint contenidos_evento_con_fecha  check ((tipo = 'evento')     = (fecha_evento is not null)),
  constraint contenidos_encuesta_con_cierre check ((tipo = 'encuesta') = (cierra_en is not null))
);
-- Feed principal: orden por score y desempate por id, solo lo visible.
create index contenidos_feed_idx        on contenidos (estado, score desc, id desc);
-- Listas por tipo (/avisos, /eventos, /propuestas): fijados primero, luego recientes.
create index contenidos_tipo_idx        on contenidos (tipo, estado, fijado desc, creado_en desc);
-- «Mis publicaciones» y límite diario por autor.
create index contenidos_autor_idx       on contenidos (autor_id, creado_en desc);
-- Cola de revisión del equipo.
create index contenidos_en_revision_idx on contenidos (creado_en) where estado = 'en_revision';
-- Búsqueda de texto completo.
create index contenidos_busqueda_idx    on contenidos using gin (busqueda);
comment on table contenidos is 'Tabla base de todas las tarjetas del muro (testimonio, aviso, evento, novedad, propuesta, encuesta, denuncia).';


-- ---------------------------------------------------------------------
--  3.7 etiquetas — catálogo de hashtags
--  Resultado: slug canónico; las variantes se fusionan con fusionada_en_id.
-- ---------------------------------------------------------------------
create table etiquetas (
  id              uuid        primary key default gen_random_uuid(),
  slug            text        not null unique,                          -- «gastoderenta»; lo calcula un trigger
  nombre          text        not null,                                 -- «GastoDeRenta» (forma visible)
  fusionada_en_id uuid        references etiquetas (id) on delete set null,
  total_usos      integer     not null default 0,
  creado_en       timestamptz not null default now()
);
-- Autocompletado por trigramas (escribes "gast" y encuentra "gastoderenta").
create index etiquetas_slug_trgm_idx on etiquetas using gin (slug extensions.gin_trgm_ops);
comment on table etiquetas is 'Hashtags con forma canónica y fusión de variantes.';


-- ---------------------------------------------------------------------
--  3.8 contenido_etiquetas — N:M tarjeta ↔ etiqueta
-- ---------------------------------------------------------------------
create table contenido_etiquetas (
  contenido_id uuid not null references contenidos (id) on delete cascade,
  etiqueta_id  uuid not null references etiquetas (id)  on delete cascade,
  primary key (contenido_id, etiqueta_id)
);
-- Página /etiquetas/[tag]: todas las tarjetas de una etiqueta.
create index contenido_etiquetas_etiqueta_idx on contenido_etiquetas (etiqueta_id, contenido_id);


-- ---------------------------------------------------------------------
--  3.9 reacciones — de acuerdo / no de acuerdo (like / dislike)
--  Resultado: la llave primaria (usuario, contenido) garantiza UNA
--  reacción por persona por tarjeta y hace idempotente el INSERT.
-- ---------------------------------------------------------------------
create table reacciones (
  usuario_id   uuid        not null references usuarios (id)   on delete cascade,
  contenido_id uuid        not null references contenidos (id) on delete cascade,
  a_favor      boolean     not null,                                    -- true = de acuerdo / «a mí también me afecta»
  creado_en    timestamptz not null default now(),
  primary key (usuario_id, contenido_id)
);
create index reacciones_contenido_idx on reacciones (contenido_id);
comment on table reacciones is 'Swipe en testimonios y apoyo a propuestas; una por persona y tarjeta.';


-- ---------------------------------------------------------------------
--  3.10 comentarios — comentarios y respuestas oficiales (Q&A)
-- ---------------------------------------------------------------------
create table comentarios (
  id                   uuid             primary key default gen_random_uuid(),
  contenido_id         uuid             not null references contenidos (id) on delete cascade,
  autor_id             uuid             not null references usuarios (id)   on delete restrict,
  padre_id             uuid             references comentarios (id) on delete cascade,  -- un nivel de respuesta
  cuerpo               text             not null check (char_length(cuerpo) between 1 and 1000),
  es_respuesta_oficial boolean          not null default false,          -- publicado por Sociedad Estudiantil
  estado               estado_contenido not null default 'visible',
  creado_en            timestamptz      not null default now(),
  editado_en           timestamptz,
  eliminado_en         timestamptz
);
create index comentarios_contenido_idx on comentarios (contenido_id, creado_en);
create index comentarios_autor_idx     on comentarios (autor_id);
comment on table comentarios is 'Comentarios en cualquier tarjeta; es_respuesta_oficial marca las respuestas de la cuenta oficial.';


-- ---------------------------------------------------------------------
--  3.11 archivos — registro de todo lo que existe en Cloudinary
--  Resultado: la base NUNCA guarda bytes; guarda la referencia y los
--  metadatos para medir consumo, reutilizar duplicados y limpiar huérfanos.
-- ---------------------------------------------------------------------
create table archivos (
  id           uuid            primary key default gen_random_uuid(),
  public_id    text            not null unique,                          -- id en Cloudinary, con carpeta
  version      bigint          not null,                                 -- la devuelve Cloudinary; va en la URL
  formato      text            not null check (formato in ('jpg', 'png', 'webp', 'pdf')),
  recurso      text            not null check (recurso in ('image', 'raw')),   -- raw = PDF
  entrega      entrega_archivo not null default 'upload',                -- private = solo con URL con vencimiento
  bytes        integer         not null,
  ancho        smallint,                                                 -- NULL en PDF
  alto         smallint,
  huella       text,                                                     -- etag (MD5) de Cloudinary: detecta duplicados
  uso          uso_archivo     not null,
  subido_por   uuid            references usuarios (id) on delete set null,
  creado_en    timestamptz     not null default now(),
  eliminado_en timestamptz,                                              -- borrado lógico; el job lo quita de Cloudinary

  -- Límites de tamaño: 5 MB imagen, 10 MB PDF.
  constraint archivos_tamano check (
    (recurso = 'image' and bytes between 1 and 5 * 1024 * 1024) or
    (recurso = 'raw'   and bytes between 1 and 10 * 1024 * 1024)
  ),
  -- Una evidencia jamás es pública.
  constraint archivos_evidencia_privada check (uso <> 'evidencia' or entrega = 'private')
);
create index archivos_huella_idx     on archivos (huella);
create index archivos_subido_por_idx on archivos (subido_por, creado_en desc);    -- cuota por alumno
create index archivos_uso_idx        on archivos (uso);
create index archivos_eliminados_idx on archivos (eliminado_en) where eliminado_en is not null;
comment on table archivos is 'Referencia y metadatos de cada archivo en Cloudinary. Los bytes nunca se guardan aquí.';

-- Ahora que archivos existe, la foto de la carrera:
alter table programas
  add column imagen_id uuid references archivos (id) on delete set null;


-- ---------------------------------------------------------------------
--  3.12 contenido_adjuntos — imágenes de una tarjeta
--  Resultado: hasta 3 por aviso/evento/propuesta; ninguna en testimonios
--  ni denuncias (la evidencia va por denuncia_evidencia). Lo valida un trigger.
-- ---------------------------------------------------------------------
create table contenido_adjuntos (
  contenido_id uuid     not null references contenidos (id) on delete cascade,
  archivo_id   uuid     not null references archivos (id)   on delete cascade,
  orden        smallint not null default 1,
  pie          text     check (char_length(pie) <= 280),                -- pie de foto / texto alternativo
  primary key (contenido_id, archivo_id),
  unique (contenido_id, orden)
);


-- ---------------------------------------------------------------------
--  3.13 encuesta_opciones — opciones de una encuesta
--  UNIQUE (id, contenido_id) existe para que encuesta_votos pueda tener
--  una FK compuesta y así la base garantice que la opción votada
--  pertenece a esa encuesta.
-- ---------------------------------------------------------------------
create table encuesta_opciones (
  id           uuid     primary key default gen_random_uuid(),
  contenido_id uuid     not null references contenidos (id) on delete cascade,
  texto        text     not null check (char_length(texto) between 1 and 120),
  orden        smallint not null,
  total_votos  integer  not null default 0,
  unique (contenido_id, orden),
  unique (id, contenido_id)
);


-- ---------------------------------------------------------------------
--  3.14 encuesta_votos — un voto por alumno por encuesta
-- ---------------------------------------------------------------------
create table encuesta_votos (
  contenido_id uuid        not null references contenidos (id) on delete cascade,
  usuario_id   uuid        not null references usuarios (id)   on delete cascade,
  opcion_id    uuid        not null,
  creado_en    timestamptz not null default now(),
  primary key (contenido_id, usuario_id),
  -- La opción debe ser de ESTA encuesta:
  foreign key (opcion_id, contenido_id) references encuesta_opciones (id, contenido_id) on delete cascade
);
create index encuesta_votos_opcion_idx on encuesta_votos (opcion_id);


-- ---------------------------------------------------------------------
--  3.15 asambleas — extensión de un evento con orden del día y minuta
-- ---------------------------------------------------------------------
create table asambleas (
  contenido_id         uuid               primary key references contenidos (id) on delete cascade,
  modalidad            modalidad_asamblea not null default 'presencial',
  orden_del_dia        text               not null,
  estado               estado_asamblea    not null default 'convocada',
  minuta               text,
  minuta_publicada_en  timestamptz,
  asistentes_estimados integer            check (asistentes_estimados >= 0),
  creado_en            timestamptz        not null default now()
);


-- ---------------------------------------------------------------------
--  3.16 asamblea_acuerdos — acuerdos y su seguimiento
-- ---------------------------------------------------------------------
create table asamblea_acuerdos (
  id               uuid        primary key default gen_random_uuid(),
  asamblea_id      uuid        not null references asambleas (contenido_id) on delete cascade,
  orden            smallint    not null,
  descripcion      text        not null,
  responsable      text,                                                -- comisión o área, no datos personales
  fecha_compromiso date,
  cumplido_en      timestamptz,
  creado_en        timestamptz not null default now(),
  unique (asamblea_id, orden)
);


-- ---------------------------------------------------------------------
--  3.17 categorias_denuncia — catálogo editable
-- ---------------------------------------------------------------------
create table categorias_denuncia (
  id        uuid        primary key default gen_random_uuid(),
  clave     text        not null unique,
  nombre    text        not null,
  activo    boolean     not null default true,
  orden     smallint    not null default 0,
  creado_en timestamptz not null default now()
);


-- ---------------------------------------------------------------------
--  3.18 denuncias — lo propio de un reporte de irregularidad
--  El texto, el autor, el anonimato y el estado (en_revision → visible /
--  rechazado) viven en contenidos. Aquí: categoría, testigos y revisión.
-- ---------------------------------------------------------------------
create table denuncias (
  contenido_id            uuid        primary key references contenidos (id) on delete cascade,
  categoria_id            uuid        not null references categorias_denuncia (id),
  ocurrio_en              date,
  area_involucrada        text,                                         -- área o dependencia; nunca domicilios ni teléfonos
  no_verificada           boolean     not null default true,            -- a false al llegar al umbral (5 testigos)
  total_confirmaciones    integer     not null default 0,
  revisada_por_usuario_id uuid        references usuarios (id) on delete set null,
  revisada_en             timestamptz,
  motivo_rechazo          text,
  creado_en               timestamptz not null default now()
);
create index denuncias_categoria_idx     on denuncias (categoria_id);
create index denuncias_no_verificada_idx on denuncias (no_verificada);


-- ---------------------------------------------------------------------
--  3.19 denuncia_evidencia — liga denuncia ↔ archivo (private)
-- ---------------------------------------------------------------------
create table denuncia_evidencia (
  denuncia_id uuid        not null references denuncias (contenido_id) on delete cascade,
  archivo_id  uuid        not null references archivos (id)            on delete cascade,
  descripcion text        check (char_length(descripcion) <= 280),
  creado_en   timestamptz not null default now(),
  primary key (denuncia_id, archivo_id)
);
create index denuncia_evidencia_archivo_idx on denuncia_evidencia (archivo_id);


-- ---------------------------------------------------------------------
--  3.20 denuncia_confirmaciones — «fui testigo»; una por persona
-- ---------------------------------------------------------------------
create table denuncia_confirmaciones (
  denuncia_id uuid        not null references denuncias (contenido_id) on delete cascade,
  usuario_id  uuid        not null references usuarios (id)            on delete cascade,
  creado_en   timestamptz not null default now(),
  primary key (denuncia_id, usuario_id)
);


-- ---------------------------------------------------------------------
--  3.21 denuncia_replicas — derecho de réplica (publica la cuenta oficial)
-- ---------------------------------------------------------------------
create table denuncia_replicas (
  id                       uuid        primary key default gen_random_uuid(),
  denuncia_id              uuid        not null references denuncias (contenido_id) on delete cascade,
  texto                    text        not null check (char_length(texto) between 1 and 4000),
  publicada_por_usuario_id uuid        not null references usuarios (id) on delete restrict,
  publicada_en             timestamptz not null default now()
);
create index denuncia_replicas_denuncia_idx on denuncia_replicas (denuncia_id);


-- ---------------------------------------------------------------------
--  3.22 reportes_contenido — botón «Reportar» (tarjeta o comentario)
--  Resultado: la unicidad (contenido, reportado_por) hace que "5 reportes"
--  sean cinco personas distintas.
-- ---------------------------------------------------------------------
create table reportes_contenido (
  id            uuid           primary key default gen_random_uuid(),
  contenido_id  uuid           references contenidos (id)  on delete cascade,
  comentario_id uuid           references comentarios (id) on delete cascade,
  reportado_por uuid           not null references usuarios (id) on delete cascade,
  motivo        motivo_reporte not null default 'otro',
  detalle       text           check (char_length(detalle) <= 280),
  creado_en     timestamptz    not null default now(),
  -- Exactamente uno de los dos: o es una tarjeta o es un comentario.
  constraint reportes_un_solo_objetivo check (num_nonnulls(contenido_id, comentario_id) = 1)
);
create unique index reportes_unico_por_contenido  on reportes_contenido (contenido_id, reportado_por)  where contenido_id  is not null;
create unique index reportes_unico_por_comentario on reportes_contenido (comentario_id, reportado_por) where comentario_id is not null;


-- ---------------------------------------------------------------------
--  3.23 acciones_moderacion — bitácora de auditoría
--  Sobrevive al contenido (SET NULL): siempre se sabe qué se hizo y por qué.
-- ---------------------------------------------------------------------
create table acciones_moderacion (
  id                       uuid              primary key default gen_random_uuid(),
  contenido_id             uuid              references contenidos (id)  on delete set null,
  comentario_id            uuid              references comentarios (id) on delete set null,
  accion                   accion_moderacion not null,
  estado_anterior          estado_contenido,
  estado_nuevo             estado_contenido,
  razon                    text              not null,
  ejecutado_por_usuario_id uuid              references usuarios (id) on delete set null,   -- NULL = el sistema
  creado_en                timestamptz       not null default now()
);
create index acciones_moderacion_contenido_idx on acciones_moderacion (contenido_id, creado_en desc);


-- ---------------------------------------------------------------------
--  3.24 apelaciones — el autor pide revisar una decisión
-- ---------------------------------------------------------------------
create table apelaciones (
  id                      uuid             primary key default gen_random_uuid(),
  contenido_id            uuid             not null references contenidos (id) on delete cascade,
  autor_id                uuid             not null references usuarios (id)   on delete cascade,
  texto                   text             not null check (char_length(texto) between 1 and 2000),
  estado                  estado_apelacion not null default 'pendiente',
  resuelta_por_usuario_id uuid             references usuarios (id) on delete set null,
  resolucion              text,
  creado_en               timestamptz      not null default now(),
  resuelta_en             timestamptz
);
-- Solo una apelación abierta por tarjeta.
create unique index apelaciones_una_pendiente on apelaciones (contenido_id) where estado = 'pendiente';


-- ---------------------------------------------------------------------
--  3.25 palabras_bloqueadas — lista del filtro local (editable sin redesplegar)
-- ---------------------------------------------------------------------
create table palabras_bloqueadas (
  id        uuid        primary key default gen_random_uuid(),
  patron    text        not null,                                       -- palabra, raíz o expresión regular
  es_regex  boolean     not null default false,
  motivo    text        not null,                                       -- lenguaje_ofensivo · dato_personal
  activo    boolean     not null default true,
  creado_en timestamptz not null default now()
);


-- ---------------------------------------------------------------------
--  3.26 firmas_apoyo — una firma de respaldo por alumno
-- ---------------------------------------------------------------------
create table firmas_apoyo (
  usuario_id  uuid        primary key references usuarios (id) on delete cascade,
  programa_id uuid        not null references programas (id),
  creado_en   timestamptz not null default now()
);
create index firmas_apoyo_programa_idx on firmas_apoyo (programa_id);


-- ---------------------------------------------------------------------
--  3.27 notificaciones — avisos al alumno
-- ---------------------------------------------------------------------
create table notificaciones (
  id           uuid        primary key default gen_random_uuid(),
  usuario_id   uuid        not null references usuarios (id) on delete cascade,
  tipo         text        not null,                                    -- denuncia_verificada, cuenta_dada_de_baja…
  mensaje      text        not null,
  contenido_id uuid        references contenidos (id) on delete cascade,  -- enlace directo a la tarjeta
  leida_en     timestamptz,                                             -- NULL = no leída
  creado_en    timestamptz not null default now()
);
create index notificaciones_usuario_idx   on notificaciones (usuario_id, creado_en desc);
create index notificaciones_no_leidas_idx on notificaciones (usuario_id) where leida_en is null;


-- ---------------------------------------------------------------------
--  3.28 eventos_integracion — outbox de eventos entre módulos
--  Resultado: cada módulo deja aquí su evento en la MISMA transacción
--  que el cambio; el cron lo reparte. intentos + siguiente_intento_en
--  evitan que un evento roto se reintente para siempre.
-- ---------------------------------------------------------------------
create table eventos_integracion (
  id                   uuid                      primary key default gen_random_uuid(),
  tipo                 text                      not null,              -- TestimonioPublicado, DenunciaAlcanzoUmbral…
  payload              jsonb                     not null default '{}'::jsonb,
  estado               estado_evento_integracion not null default 'pendiente',
  intentos             smallint                  not null default 0,
  siguiente_intento_en timestamptz               not null default now(),
  ultimo_error         text,
  creado_en            timestamptz               not null default now(),
  procesado_en         timestamptz
);
-- El dispatcher solo mira los pendientes cuyo turno ya llegó.
create index eventos_pendientes_idx on eventos_integracion (siguiente_intento_en, creado_en) where estado = 'pendiente';
comment on table eventos_integracion is 'Outbox: eventos entre módulos con reintentos y backoff.';


-- =====================================================================
--  4. VISTAS
--  Una vista es una consulta guardada con nombre. Las tres encapsulan
--  reglas que NO queremos repetir en cada consulta del backend.
-- =====================================================================

-- ---------------------------------------------------------------------
--  4.1 vista_muro — el feed público
--  Resultado: solo tarjetas visibles; si la publicación es anónima, el
--  alias y el programa salen NULL desde la propia consulta (ADR 0005):
--  ninguna pantalla puede filtrar un alias anónimo por descuido.
-- ---------------------------------------------------------------------
create or replace view vista_muro
with (security_invoker = true) as
select
  c.id,
  c.tipo,
  c.titulo,
  c.cuerpo,
  c.nivel,
  c.fijado,
  c.score,
  c.total_apoyos,
  c.total_rechazos,
  c.total_comentarios,
  c.es_anonimo,
  case when c.es_anonimo then null  else u.alias::text        end as autor_alias,
  case when c.es_anonimo then null  else c.programa_id        end as programa_id,
  case when c.es_anonimo then false else u.es_cuenta_oficial  end as autor_oficial,
  c.fecha_evento,
  c.lugar,
  c.cierra_en,
  (c.tipo = 'encuesta' and c.cierra_en < now())                   as encuesta_cerrada,
  d.no_verificada,                                                 -- solo en denuncias; NULL en el resto
  cd.nombre                                                        as categoria_denuncia,
  c.creado_en
from contenidos c
join usuarios u              on u.id = c.autor_id
left join denuncias d        on d.contenido_id = c.id
left join categorias_denuncia cd on cd.id = d.categoria_id
where c.estado = 'visible';

comment on view vista_muro is
  'Feed público. Uso: select * from vista_muro where (score, id) < ($1, $2) order by score desc, id desc limit 20;';


-- ---------------------------------------------------------------------
--  4.2 vista_cola_moderacion — lo que revisa el equipo
--  Resultado: tarjetas en revisión u ocultas, o con 5+ reportes, con su
--  última acción y si tienen apelación pendiente. Aquí el alias SÍ se
--  muestra aunque la tarjeta sea anónima: es uso interno del núcleo
--  («pseudónimo hacia afuera, responsable hacia adentro»).
-- ---------------------------------------------------------------------
create or replace view vista_cola_moderacion
with (security_invoker = true) as
select
  c.id,
  c.tipo,
  c.estado,
  c.titulo,
  left(c.cuerpo, 160)                                              as resumen,
  c.es_anonimo,
  u.alias::text                                                    as autor_alias,
  c.total_reportes,
  (select a.accion
     from acciones_moderacion a
    where a.contenido_id = c.id
    order by a.creado_en desc
    limit 1)                                                       as ultima_accion,
  exists (select 1
            from apelaciones ap
           where ap.contenido_id = c.id and ap.estado = 'pendiente') as apelacion_pendiente,
  c.creado_en
from contenidos c
join usuarios u on u.id = c.autor_id
where c.estado in ('en_revision', 'oculto')
   or c.total_reportes >= 5
order by (c.estado = 'en_revision') desc, c.creado_en;


-- ---------------------------------------------------------------------
--  4.3 vista_estadisticas_programa — firmas por programa
--  Resultado: los TSU se suman a su programa de continuidad, así el
--  tablero muestra los 10 programas grandes. Sustituye a la tabla
--  estadisticas_programa y al job de cada 15 minutos del avance.
-- ---------------------------------------------------------------------
create or replace view vista_estadisticas_programa
with (security_invoker = true) as
with base as (
  select
    coalesce(p.programa_continuidad_id, p.id)                     as programa_raiz_id,
    p.matricula_total,
    (select count(*) from firmas_apoyo f where f.programa_id = p.id) as firmas
  from programas p
  where p.activo
)
select
  pr.id                                                            as programa_id,
  pr.clave,
  pr.nombre,
  pr.nivel,
  sum(b.matricula_total)::integer                                  as matricula_total,
  sum(b.firmas)::integer                                           as total_firmas,
  case when sum(b.matricula_total) > 0
       then round(100.0 * sum(b.firmas) / sum(b.matricula_total), 2)
       else 0 end                                                  as porcentaje
from base b
join programas pr on pr.id = b.programa_raiz_id
group by pr.id, pr.clave, pr.nombre, pr.nivel, pr.orden
order by pr.orden, pr.nombre;


-- =====================================================================
--  5. FUNCIONES Y TRIGGERS
--  Regla del proyecto: la base CUENTA y VALIDA; la aplicación DECIDE.
--  Los contadores y las validaciones de integridad viven aquí porque son
--  atómicos (dos swipes al mismo tiempo no se pisan). Los umbrales
--  (5 reportes, 5 testigos) y los eventos siguen en el Worker.
-- =====================================================================

-- ---------------------------------------------------------------------
--  5.1 actualizado_en automático
-- ---------------------------------------------------------------------
create or replace function fn_actualizado_en() returns trigger
language plpgsql as $$
begin
  new.actualizado_en := now();
  return new;
end $$;

create trigger usuarios_actualizado_en   before update on usuarios   for each row execute function fn_actualizado_en();
create trigger contenidos_actualizado_en before update on contenidos for each row execute function fn_actualizado_en();


-- ---------------------------------------------------------------------
--  5.2 Slug canónico de etiquetas
--  Resultado: «Gasto De Renta», «#GastoDeRenta» y «gastoderenta» producen
--  el mismo slug, y el UNIQUE evita que existan como etiquetas distintas.
-- ---------------------------------------------------------------------
create or replace function fn_etiqueta_slug() returns trigger
language plpgsql as $$
begin
  new.nombre := regexp_replace(trim(new.nombre), '^#+', '');           -- quita el # si lo traía
  new.slug   := regexp_replace(lower(extensions.unaccent(new.nombre)), '[^a-z0-9]', '', 'g');
  if new.slug = '' then
    raise exception 'La etiqueta necesita al menos una letra o número';
  end if;
  return new;
end $$;

create trigger etiquetas_slug before insert or update of nombre on etiquetas
  for each row execute function fn_etiqueta_slug();


-- ---------------------------------------------------------------------
--  5.3 Contadores de reacciones → contenidos.total_apoyos / total_rechazos
--  Cubre dar like, dar dislike, cambiar de opinión (UPDATE) y quitar.
-- ---------------------------------------------------------------------
create or replace function fn_contar_reacciones() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update contenidos
       set total_apoyos   = total_apoyos   + (new.a_favor)::int,
           total_rechazos = total_rechazos + (not new.a_favor)::int
     where id = new.contenido_id;

  elsif tg_op = 'DELETE' then
    update contenidos
       set total_apoyos   = total_apoyos   - (old.a_favor)::int,
           total_rechazos = total_rechazos - (not old.a_favor)::int
     where id = old.contenido_id;

  elsif tg_op = 'UPDATE' and old.a_favor <> new.a_favor then
    -- cambió de opinión: uno sube, el otro baja
    update contenidos
       set total_apoyos   = total_apoyos   + (new.a_favor)::int - (old.a_favor)::int,
           total_rechazos = total_rechazos + (not new.a_favor)::int - (not old.a_favor)::int
     where id = new.contenido_id;
  end if;
  return null;
end $$;

create trigger reacciones_contadores
  after insert or update of a_favor or delete on reacciones
  for each row execute function fn_contar_reacciones();


-- ---------------------------------------------------------------------
--  5.4 Contador de comentarios (cuenta solo los no eliminados)
-- ---------------------------------------------------------------------
create or replace function fn_contar_comentarios() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.eliminado_en is null then
    update contenidos set total_comentarios = total_comentarios + 1 where id = new.contenido_id;
  elsif tg_op = 'DELETE' and old.eliminado_en is null then
    update contenidos set total_comentarios = total_comentarios - 1 where id = old.contenido_id;
  elsif tg_op = 'UPDATE' then
    if old.eliminado_en is null and new.eliminado_en is not null then
      update contenidos set total_comentarios = total_comentarios - 1 where id = new.contenido_id;
    elsif old.eliminado_en is not null and new.eliminado_en is null then
      update contenidos set total_comentarios = total_comentarios + 1 where id = new.contenido_id;
    end if;
  end if;
  return null;
end $$;

create trigger comentarios_contadores
  after insert or update of eliminado_en or delete on comentarios
  for each row execute function fn_contar_comentarios();


-- ---------------------------------------------------------------------
--  5.5 Contador de reportes → contenidos.total_reportes
--  El Worker lee este número y decide si ya llegó al umbral (5).
-- ---------------------------------------------------------------------
create or replace function fn_contar_reportes() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' and new.contenido_id is not null then
    update contenidos set total_reportes = total_reportes + 1 where id = new.contenido_id;
  elsif tg_op = 'DELETE' and old.contenido_id is not null then
    update contenidos set total_reportes = total_reportes - 1 where id = old.contenido_id;
  end if;
  return null;
end $$;

create trigger reportes_contadores
  after insert or delete on reportes_contenido
  for each row execute function fn_contar_reportes();


-- ---------------------------------------------------------------------
--  5.6 Contador de testigos → denuncias.total_confirmaciones
-- ---------------------------------------------------------------------
create or replace function fn_contar_confirmaciones() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update denuncias set total_confirmaciones = total_confirmaciones + 1 where contenido_id = new.denuncia_id;
  elsif tg_op = 'DELETE' then
    update denuncias set total_confirmaciones = total_confirmaciones - 1 where contenido_id = old.denuncia_id;
  end if;
  return null;
end $$;

create trigger confirmaciones_contadores
  after insert or delete on denuncia_confirmaciones
  for each row execute function fn_contar_confirmaciones();


-- ---------------------------------------------------------------------
--  5.7 Contador de votos de encuesta → encuesta_opciones.total_votos
-- ---------------------------------------------------------------------
create or replace function fn_contar_votos_encuesta() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update encuesta_opciones set total_votos = total_votos + 1 where id = new.opcion_id;
  elsif tg_op = 'DELETE' then
    update encuesta_opciones set total_votos = total_votos - 1 where id = old.opcion_id;
  elsif tg_op = 'UPDATE' and old.opcion_id <> new.opcion_id then
    update encuesta_opciones set total_votos = total_votos - 1 where id = old.opcion_id;
    update encuesta_opciones set total_votos = total_votos + 1 where id = new.opcion_id;
  end if;
  return null;
end $$;

create trigger encuesta_votos_contadores
  after insert or update of opcion_id or delete on encuesta_votos
  for each row execute function fn_contar_votos_encuesta();


-- ---------------------------------------------------------------------
--  5.8 Contador de usos de etiqueta → etiquetas.total_usos
-- ---------------------------------------------------------------------
create or replace function fn_contar_usos_etiqueta() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update etiquetas set total_usos = total_usos + 1 where id = new.etiqueta_id;
  elsif tg_op = 'DELETE' then
    update etiquetas set total_usos = total_usos - 1 where id = old.etiqueta_id;
  end if;
  return null;
end $$;

create trigger contenido_etiquetas_contadores
  after insert or delete on contenido_etiquetas
  for each row execute function fn_contar_usos_etiqueta();


-- ---------------------------------------------------------------------
--  5.9 Validación genérica: la tabla satélite exige un tipo de contenido
--  Resultado: una fila de asambleas solo puede apuntar a un evento, una
--  de denuncias a una denuncia, una opción de encuesta a una encuesta.
--  El tipo exigido se pasa como argumento del trigger.
-- ---------------------------------------------------------------------
create or replace function fn_exigir_tipo_contenido() returns trigger
language plpgsql as $$
declare
  tipo_exigido tipo_contenido := tg_argv[0]::tipo_contenido;
  tipo_real    tipo_contenido;
begin
  select tipo into tipo_real from contenidos where id = new.contenido_id;
  if tipo_real is distinct from tipo_exigido then
    raise exception 'La tabla % solo admite contenidos de tipo %, y % es de tipo %',
      tg_table_name, tipo_exigido, new.contenido_id, tipo_real;
  end if;
  return new;
end $$;

create trigger asambleas_tipo         before insert or update of contenido_id on asambleas         for each row execute function fn_exigir_tipo_contenido('evento');
create trigger denuncias_tipo         before insert or update of contenido_id on denuncias         for each row execute function fn_exigir_tipo_contenido('denuncia');
create trigger encuesta_opciones_tipo before insert or update of contenido_id on encuesta_opciones for each row execute function fn_exigir_tipo_contenido('encuesta');
create trigger encuesta_votos_tipo    before insert or update of contenido_id on encuesta_votos    for each row execute function fn_exigir_tipo_contenido('encuesta');


-- ---------------------------------------------------------------------
--  5.10 Validaciones de archivos: uso correcto y límite de adjuntos
-- ---------------------------------------------------------------------

-- contenido_adjuntos: máximo 3, nunca en testimonios ni denuncias, y el
-- archivo debe haberse subido con uso = portada_contenido.
create or replace function fn_validar_adjunto() returns trigger
language plpgsql as $$
declare
  tipo_tarjeta tipo_contenido;
  uso_real     uso_archivo;
  cuantos      integer;
begin
  select tipo into tipo_tarjeta from contenidos where id = new.contenido_id;
  if tipo_tarjeta in ('testimonio', 'denuncia') then
    raise exception 'Las tarjetas de tipo % no llevan imágenes adjuntas', tipo_tarjeta;
  end if;

  select uso into uso_real from archivos where id = new.archivo_id;
  if uso_real <> 'portada_contenido' then
    raise exception 'El archivo % se subió con uso %, no como imagen de publicación', new.archivo_id, uso_real;
  end if;

  select count(*) into cuantos from contenido_adjuntos where contenido_id = new.contenido_id;
  if cuantos >= 3 then
    raise exception 'Una tarjeta admite máximo 3 imágenes';
  end if;
  return new;
end $$;

create trigger contenido_adjuntos_validar before insert on contenido_adjuntos
  for each row execute function fn_validar_adjunto();

-- denuncia_evidencia: el archivo debe ser uso = evidencia y entrega = private.
create or replace function fn_validar_evidencia() returns trigger
language plpgsql as $$
declare
  a archivos%rowtype;
begin
  select * into a from archivos where id = new.archivo_id;
  if a.uso <> 'evidencia' or a.entrega <> 'private' then
    raise exception 'La evidencia debe subirse con uso = evidencia y entrega = private';
  end if;
  return new;
end $$;

create trigger denuncia_evidencia_validar before insert on denuncia_evidencia
  for each row execute function fn_validar_evidencia();

-- programas.imagen_id: el archivo debe ser uso = foto_programa.
create or replace function fn_validar_imagen_programa() returns trigger
language plpgsql as $$
declare
  uso_real uso_archivo;
begin
  if new.imagen_id is not null then
    select uso into uso_real from archivos where id = new.imagen_id;
    if uso_real <> 'foto_programa' then
      raise exception 'La imagen del programa debe subirse con uso = foto_programa';
    end if;
  end if;
  return new;
end $$;

create trigger programas_imagen_validar before insert or update of imagen_id on programas
  for each row execute function fn_validar_imagen_programa();


-- ---------------------------------------------------------------------
--  5.11 Solo la cuenta oficial publica avisos/novedades y fija tarjetas
--  Segunda barrera: la primera es la ruta del Worker (contenido.service).
-- ---------------------------------------------------------------------
create or replace function fn_validar_contenido_oficial() returns trigger
language plpgsql as $$
declare
  es_oficial boolean;
begin
  if new.tipo in ('aviso', 'novedad') or new.fijado then
    select es_cuenta_oficial into es_oficial from usuarios where id = new.autor_id;
    if not coalesce(es_oficial, false) then
      raise exception 'Solo la cuenta Sociedad Estudiantil publica avisos y novedades o fija tarjetas';
    end if;
  end if;
  return new;
end $$;

create trigger contenidos_validar_oficial before insert or update of tipo, fijado, autor_id on contenidos
  for each row execute function fn_validar_contenido_oficial();


-- ---------------------------------------------------------------------
--  5.12 recalcular_ranking() — el score del muro en una sola sentencia
--  Misma fórmula que shared/ranking/score.ts del backend:
--    base = apoyos + 2 × confirmaciones de testigos
--    peso por nivel: bajo 1.0 · medio 1.4 · alto 1.8
--    decaimiento: 1 / (horas + 2) ^ 1.5   (tipo "hot" de Reddit)
--  Se guarda ×1000 como entero para que el cursor (score, id) sea estable.
--  La llama el cron de 15 minutos: select recalcular_ranking();
-- ---------------------------------------------------------------------
create or replace function recalcular_ranking() returns integer
language plpgsql as $$
declare
  filas integer;
begin
  update contenidos c
     set score = round(
           1000 * (c.total_apoyos
                   + 2 * coalesce((select d.total_confirmaciones
                                     from denuncias d
                                    where d.contenido_id = c.id), 0))
                * case c.nivel when 'bajo' then 1.0 when 'medio' then 1.4 else 1.8 end
                / power(extract(epoch from now() - c.creado_en) / 3600 + 2, 1.5)
         )::integer
   where c.estado = 'visible';
  get diagnostics filas = row_count;
  return filas;                                                          -- cuántas tarjetas se recalcularon
end $$;


-- ---------------------------------------------------------------------
--  5.13 archivos_huerfanos() — qué borrar de Cloudinary
--  Resultado: archivos marcados como eliminados, o que después de 24 h
--  nadie referencia (la tarjeta se rechazó, se borró o la subida quedó
--  a medias). El job semanal del Worker los borra en Cloudinary y luego
--  ejecuta: delete from archivos where id = any($ids);
-- ---------------------------------------------------------------------
create or replace function archivos_huerfanos()
returns table (id uuid, public_id text, recurso text, entrega entrega_archivo, bytes integer)
language sql stable as $$
  select a.id, a.public_id, a.recurso, a.entrega, a.bytes
    from archivos a
   where a.eliminado_en is not null
      or (a.creado_en < now() - interval '24 hours'
          and not exists (select 1 from contenido_adjuntos ca where ca.archivo_id = a.id)
          and not exists (select 1 from denuncia_evidencia de where de.archivo_id = a.id)
          and not exists (select 1 from programas p where p.imagen_id = a.id));
$$;


-- ---------------------------------------------------------------------
--  5.14 purgar_antiguos() — limpieza periódica (cron diario)
--  Borra eventos ya procesados con más de 30 días y notificaciones leídas
--  con más de 90. Devuelve cuántas filas quitó.
-- ---------------------------------------------------------------------
create or replace function purgar_antiguos() returns integer
language plpgsql as $$
declare
  n1 integer; n2 integer;
begin
  delete from eventos_integracion where estado = 'procesado' and procesado_en < now() - interval '30 days';
  get diagnostics n1 = row_count;
  delete from notificaciones where leida_en is not null and leida_en < now() - interval '90 days';
  get diagnostics n2 = row_count;
  return n1 + n2;
end $$;


-- ---------------------------------------------------------------------
--  5.15 anonimizar_usuario(id) — baja voluntaria (LFPDPPP)
--  Resultado: la cuenta deja de ser identificable, pero su contenido
--  permanece como anónimo (por eso autor_id es ON DELETE RESTRICT).
-- ---------------------------------------------------------------------
create or replace function anonimizar_usuario(p_usuario_id uuid) returns void
language plpgsql as $$
begin
  update usuarios
     set alias        = ('cuenta_eliminada_' || left(p_usuario_id::text, 8))::extensions.citext,
         rol          = 'no_verificado',
         programa_id  = null,
         eliminado_en = now()
   where id = p_usuario_id;

  update contenidos set es_anonimo = true where autor_id = p_usuario_id;
  delete from privado.identidades where usuario_id = p_usuario_id;
  delete from reacciones          where usuario_id = p_usuario_id;
  delete from notificaciones      where usuario_id = p_usuario_id;
end $$;


-- =====================================================================
--  6. INTEGRACIÓN CON SUPABASE AUTH (variante A — la del diagrama)
--  Supabase guarda la cuenta de autenticación en auth.users. Estos tres
--  triggers conectan esa tabla con la nuestra:
--    · antes de crear un usuario en Auth: solo correo institucional;
--    · al crearse: se crea su fila en usuarios (alias aleatorio) e identidades;
--    · al confirmar el correo / iniciar sesión: sube a verificado y
--      registra el último acceso.
--  Corren como "security definer" porque el servicio de Auth no tiene
--  permisos sobre nuestras tablas.
--  Si el equipo elige la variante B (enlace mágico propio), NO ejecutes
--  esta sección y ve a la sección 8.
-- =====================================================================

-- ---------------------------------------------------------------------
--  6.1 Solo correos del dominio institucional
--  Cambia 'uthh.edu.mx' si el dominio oficial es otro (p. ej. alumnos.uthh.edu.mx).
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

create trigger auth_validar_dominio
  before insert on auth.users
  for each row execute function fn_auth_validar_dominio();


-- ---------------------------------------------------------------------
--  6.2 Crear la fila en usuarios e identidades cuando Auth crea la cuenta
--  Resultado: alias aleatorio tipo «alumno_3fa9c2b1» (el alumno lo puede
--  cambiar después); nunca se deriva del correo.
-- ---------------------------------------------------------------------
create or replace function fn_auth_crear_usuario() returns trigger
language plpgsql security definer set search_path = public, privado, extensions as $$
begin
  insert into usuarios (id, alias, rol, correo_confirmado_en, ultimo_acceso_en)
  values (
    new.id,
    -- Alias público aleatorio. Nunca se deriva del correo: si el correo
    -- institucional lleva la matrícula, derivarlo identificaría al alumno.
    ('alumno_' || encode(extensions.gen_random_bytes(4), 'hex'))::extensions.citext,
    -- Hay dos caminos de alta y este CASE cubre los dos:
    --  · Google/Microsoft o alta manual con Auto Confirm: el correo ya
    --    viene confirmado en el propio INSERT, así que la cuenta nace
    --    verificada. Sin esto se quedaría en SOLO LECTURA hasta su
    --    segundo inicio de sesión.
    --  · Código o enlace por correo: nace sin confirmar y la sube
    --    fn_auth_sincronizar cuando el alumno lo confirma.
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

create trigger auth_crear_usuario
  after insert on auth.users
  for each row execute function fn_auth_crear_usuario();


-- ---------------------------------------------------------------------
--  6.3 Sincronizar confirmación de correo y último acceso
--  Resultado: la PRIMERA vez que Auth confirma el correo, la cuenta sube
--  a verificado. Después, el rol solo lo mueve el padrón (baja/reactivación),
--  no cada inicio de sesión.
-- ---------------------------------------------------------------------
create or replace function fn_auth_sincronizar() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update usuarios u
     set ultimo_acceso_en     = coalesce(new.last_sign_in_at, u.ultimo_acceso_en),
         correo_confirmado_en = coalesce(u.correo_confirmado_en, new.email_confirmed_at),
         rol = case
                 when u.correo_confirmado_en is null            -- primera confirmación
                      and new.email_confirmed_at is not null
                      and u.eliminado_en is null
                 then 'verificado'::rol_usuario
                 else u.rol
               end
   where u.id = new.id;
  return new;
end $$;

create trigger auth_sincronizar
  after update of email_confirmed_at, last_sign_in_at on auth.users
  for each row execute function fn_auth_sincronizar();


-- =====================================================================
--  7. DATOS SEMILLA
-- =====================================================================

-- ---------------------------------------------------------------------
--  7.1 Programas educativos
--  ⚠ VALIDAR contra la oferta oficial vigente de la UTHH antes de usar en
--  producción (nombres, claves y a qué programa continúa cada TSU).
--  matricula_total queda en 0 hasta tener el dato oficial.
-- ---------------------------------------------------------------------
insert into programas (clave, nombre, nivel, orden) values
  -- Ingenierías (6)
  ('IDGS', 'Ingeniería en Desarrollo y Gestión de Software',     'ingenieria',   1),
  ('IMEC', 'Ingeniería en Mecatrónica',                          'ingenieria',   2),
  ('IMM',  'Ingeniería en Metal Mecánica',                       'ingenieria',   3),
  ('ICIV', 'Ingeniería Civil',                                   'ingenieria',   4),
  ('IPA',  'Ingeniería en Procesos Alimentarios',                'ingenieria',   5),
  ('IAB',  'Ingeniería en Agrobiotecnología',                    'ingenieria',   6),
  -- Licenciaturas (4)
  ('LCON', 'Licenciatura en Contaduría',                         'licenciatura', 7),
  ('LGNP', 'Licenciatura en Gestión de Negocios y Proyectos',    'licenciatura', 8),
  ('LINM', 'Licenciatura en Innovación de Negocios y Mercadotecnia', 'licenciatura', 9),
  ('LGAS', 'Licenciatura en Gastronomía',                        'licenciatura', 10);

-- TSU: cada uno apunta al programa al que da continuidad.
insert into programas (clave, nombre, nivel, orden, programa_continuidad_id) values
  ('TSU-TI',   'TSU en Tecnologías de la Información',            'tsu', 11, (select id from programas where clave = 'IDGS')),
  ('TSU-MEC',  'TSU en Mecatrónica',                              'tsu', 12, (select id from programas where clave = 'IMEC')),
  ('TSU-MAUT', 'TSU en Mecánica área Automotriz',                 'tsu', 13, (select id from programas where clave = 'IMM')),
  ('TSU-MIND', 'TSU en Mecánica área Industrial',                 'tsu', 14, (select id from programas where clave = 'IMM')),
  ('TSU-CON',  'TSU en Construcción',                             'tsu', 15, (select id from programas where clave = 'ICIV')),
  ('TSU-PA',   'TSU en Procesos Alimentarios',                    'tsu', 16, (select id from programas where clave = 'IPA')),
  ('TSU-AB',   'TSU en Agrobiotecnología',                        'tsu', 17, (select id from programas where clave = 'IAB')),
  ('TSU-CONT', 'TSU en Contaduría',                               'tsu', 18, (select id from programas where clave = 'LCON')),
  ('TSU-ADM',  'TSU en Administración',                           'tsu', 19, (select id from programas where clave = 'LGNP')),
  ('TSU-DN',   'TSU en Desarrollo de Negocios',                   'tsu', 20, (select id from programas where clave = 'LINM')),
  ('TSU-GAS',  'TSU en Gastronomía',                              'tsu', 21, (select id from programas where clave = 'LGAS'));



-- ---------------------------------------------------------------------
--  7.1b Cuenta de servicio del equipo
--  Es la que opera «Sociedad Estudiantil». Al no ser institucional,
--  necesita estar en la lista blanca o el trigger la rechazaría.
--  ⚠ Cambiar por el correo real del equipo. Debe ir en minúsculas.
-- ---------------------------------------------------------------------
insert into privado.cuentas_autorizadas (correo, motivo, autorizada_por)
values (
  'desarrollut.0@gmail.com',
  'Cuenta compartida del equipo de desarrollo; opera la cuenta «Sociedad Estudiantil»',
  'Pedro Rubio Angeles'
)
on conflict (correo) do nothing;


-- ---------------------------------------------------------------------
--  7.2 Categorías de denuncia (las mismas cinco del frontend)
-- ---------------------------------------------------------------------
insert into categorias_denuncia (clave, nombre, orden) values
  ('contrataciones',  'Contrataciones',     1),
  ('recursos',        'Recursos',           2),
  ('trato',           'Trato al alumnado',  3),
  ('infraestructura', 'Infraestructura',    4),
  ('otro',            'Otro',               5);


-- ---------------------------------------------------------------------
--  7.3 Palabras bloqueadas (arranque; el equipo la amplía desde Supabase)
--  Las dos expresiones regulares vienen de filtro-local.ts.
-- ---------------------------------------------------------------------
insert into palabras_bloqueadas (patron, es_regex, motivo) values
  ('idiota',   false, 'lenguaje_ofensivo'),
  ('estúpid',  false, 'lenguaje_ofensivo'),
  ('maldit',   false, 'lenguaje_ofensivo'),
  ('\b\d{2,3}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b', true, 'dato_personal_telefono'),
  ('\b[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}\b',        true, 'dato_personal_rfc');


-- ---------------------------------------------------------------------
--  7.4 Cuenta oficial «Sociedad Estudiantil»
--  Con Supabase Auth: primero crea la cuenta en Authentication → Users
--  (correo institucional del núcleo). El trigger 6.2 crea su fila en
--  usuarios; luego ejecuta esto con el id que aparece en auth.users:
--
--    update usuarios
--       set alias = 'Sociedad Estudiantil', es_cuenta_oficial = true,
--           rol = 'verificado', correo_confirmado_en = now()
--     where id = '<uuid de auth.users>';
-- ---------------------------------------------------------------------


-- =====================================================================
--  8. VARIANTE B — ENLACE MÁGICO PROPIO (sin Supabase Auth)
--  Ejecutar SOLO si el equipo conserva la autenticación del backend
--  (tokens de un solo uso + sesiones en la base). En ese caso, NO
--  ejecutes la sección 6 y descomenta este bloque.
-- =====================================================================
/*
-- usuarios.id deja de depender de auth.users y se genera aquí.
alter table usuarios drop constraint usuarios_id_fkey;
alter table usuarios alter column id set default gen_random_uuid();

-- El correo solo como HMAC (el pepper vive en el Worker), para poder
-- buscar la cuenta sin guardar el correo en claro.
alter table privado.identidades add column correo_hmac text unique;

-- Sesiones de 30 días detrás de la cookie HttpOnly.
create table sesiones (
  id            uuid        primary key default gen_random_uuid(),
  usuario_id    uuid        not null references usuarios (id) on delete cascade,
  token_hash    text        not null unique,          -- sha256(token); el token solo vive en la cookie
  expira_en     timestamptz not null,
  ultimo_uso_en timestamptz,
  revocada_en   timestamptz,                          -- baja del padrón, cierre de sesión, cuenta eliminada
  creado_en     timestamptz not null default now()
);
create index sesiones_usuario_idx on sesiones (usuario_id);
create index sesiones_expira_idx  on sesiones (expira_en);

-- Enlaces mágicos de un solo uso (15 minutos).
create table tokens_acceso (
  id         uuid        primary key default gen_random_uuid(),
  usuario_id uuid        not null references usuarios (id) on delete cascade,
  token_hash text        not null unique,
  expira_en  timestamptz not null,
  usado_en   timestamptz,                             -- NULL = sin usar
  creado_en  timestamptz not null default now()
);
create index tokens_acceso_usuario_idx on tokens_acceso (usuario_id, creado_en desc);  -- rate limit por hora

-- Purga de tokens vencidos y sesiones expiradas o revocadas (agregar al cron diario).
create or replace function purgar_sesiones() returns integer
language plpgsql as $$
declare n1 integer; n2 integer;
begin
  delete from tokens_acceso where expira_en < now() - interval '1 day';
  get diagnostics n1 = row_count;
  delete from sesiones where expira_en < now() or revocada_en < now() - interval '30 days';
  get diagnostics n2 = row_count;
  return n1 + n2;
end $$;
*/


-- =====================================================================
--  9. SEGURIDAD: ROL DEL BACKEND, RLS Y POLÍTICAS
--  Idea: el Worker es el ÚNICO cliente de la base. RLS se activa en todas
--  las tablas como candado de la Data API (aunque las llaves del proyecto
--  se filtren, anon/authenticated no leen nada), y una sola política por
--  tabla deja pasar al rol app_backend. Además: Settings → API → desactivar
--  la Data API, porque el proyecto no la usa.
-- =====================================================================

-- ---------------------------------------------------------------------
--  9.1 Rol de mínimo privilegio para el Worker
--  ⚠ Cambia la contraseña. Cadena para el pooler:
--  postgresql://app_backend.<ref>:<contraseña>@<host>.pooler.supabase.com:6543/postgres
--  Las migraciones (drizzle-kit) siguen corriendo con postgres.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'app_backend') then
    create role app_backend login password 'CAMBIA_ESTA_CONTRASENA' nosuperuser nocreatedb nocreaterole noinherit;
  end if;
end $$;

grant usage on schema public, privado, extensions to app_backend;
grant select, insert, update, delete on all tables in schema public, privado to app_backend;
grant execute on all functions in schema public to app_backend;
alter default privileges in schema public, privado grant select, insert, update, delete on tables to app_backend;
alter default privileges in schema public grant execute on functions to app_backend;

-- ---------------------------------------------------------------------
--  9.2 Quitar a los roles de la Data API cualquier acceso a nuestras tablas
--  (Supabase les da permisos por defecto sobre lo nuevo en public.)
-- ---------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    execute 'revoke all on all tables in schema public from anon, authenticated';
    execute 'revoke all on all functions in schema public from anon, authenticated';
    execute 'revoke usage on schema privado from anon, authenticated';
    execute 'alter default privileges in schema public revoke all on tables from anon, authenticated';
    execute 'alter default privileges in schema public revoke all on functions from anon, authenticated';
  end if;
end $$;

-- ---------------------------------------------------------------------
--  9.3 RLS en todas las tablas + política para app_backend
--  El bucle recorre public y privado para no olvidar ninguna.
-- ---------------------------------------------------------------------
do $$
declare
  t record;
begin
  for t in
    select schemaname, tablename
      from pg_tables
     where schemaname in ('public', 'privado')
  loop
    execute format('alter table %I.%I enable row level security', t.schemaname, t.tablename);
    execute format(
      'create policy backend_todo on %I.%I for all to app_backend using (true) with check (true)',
      t.schemaname, t.tablename);
  end loop;
end $$;

-- Verificación rápida: todas deben decir rls = true
-- select schemaname, tablename, rowsecurity from pg_tables where schemaname in ('public','privado') order by 1, 2;


-- =====================================================================
--  10. LIMPIEZA TOTAL (descomentar solo para empezar de cero)
-- =====================================================================
/*
drop trigger if exists auth_validar_dominio on auth.users;
drop trigger if exists auth_crear_usuario   on auth.users;
drop trigger if exists auth_sincronizar     on auth.users;
drop schema privado cascade;
drop table if exists
  eventos_integracion, notificaciones, firmas_apoyo, palabras_bloqueadas, apelaciones,
  acciones_moderacion, reportes_contenido, denuncia_replicas, denuncia_confirmaciones,
  denuncia_evidencia, denuncias, categorias_denuncia, asamblea_acuerdos, asambleas,
  encuesta_votos, encuesta_opciones, contenido_adjuntos, comentarios, reacciones,
  contenido_etiquetas, etiquetas, archivos, contenidos, usuarios, programas cascade;
-- (privado.cuentas_autorizadas se va con «drop schema privado cascade»)
drop type if exists rol_usuario, estatus_padron, nivel_educativo, tipo_contenido, estado_contenido,
  nivel_impacto, motivo_reporte, accion_moderacion, estado_apelacion, estado_evento_integracion,
  modalidad_asamblea, estado_asamblea, uso_archivo, entrega_archivo;
drop function if exists fn_actualizado_en, fn_etiqueta_slug, fn_contar_reacciones, fn_contar_comentarios,
  fn_contar_reportes, fn_contar_confirmaciones, fn_contar_votos_encuesta, fn_contar_usos_etiqueta,
  fn_exigir_tipo_contenido, fn_validar_adjunto, fn_validar_evidencia, fn_validar_imagen_programa,
  fn_validar_contenido_oficial, recalcular_ranking, archivos_huerfanos, purgar_antiguos, anonimizar_usuario,
  fn_auth_validar_dominio, fn_auth_crear_usuario, fn_auth_sincronizar;
*/

-- =====================================================================
--  FIN. Siguientes pasos: cambiar la contraseña de app_backend, crear la
--  cuenta oficial (7.4), cargar matricula_total en programas y desactivar
--  la Data API. El Worker llama a recalcular_ranking() cada 15 min y a
--  purgar_antiguos() / archivos_huerfanos() en el cron diario/semanal.
-- =====================================================================
