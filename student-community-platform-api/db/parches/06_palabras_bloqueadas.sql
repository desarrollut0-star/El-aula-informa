-- =====================================================================
--  PARCHE 3 — Lista ampliada de palabras bloqueadas (filtro local)
--  Comunidad UTHH · El Aula Informa
--
--  POR QUÉ
--  El filtro local (tabla palabras_bloqueadas) corre SIEMPRE, sin costo y
--  sin llamadas externas. Hugging Face y el LLM propio (moderacion-ml/) son
--  capas extra y solo corren si HUGGINGFACE_API_KEY / MODELO_ML_URL están
--  configuradas. Esta lista cubre groserías y términos sexuales frecuentes
--  en español de México para que el bloqueo funcione aunque esas capas no
--  estén activas.
--
--  Es EDITABLE sin volver a desplegar: agrega/quita filas cuando quieras.
--  `patron` en minúsculas; el backend compara en minúsculas por substring.
--  Marca es_regex = true solo para patrones de expresión regular.
--
--  Ejecutar en el SQL Editor de Supabase con el rol postgres.
-- =====================================================================

-- Evita duplicados al re-ejecutar el parche.
create unique index if not exists palabras_bloqueadas_patron_uk
  on palabras_bloqueadas (lower(patron));

insert into palabras_bloqueadas (patron, es_regex, motivo) values
  -- groserías / insultos
  ('pendej',        false, 'lenguaje_ofensivo'),
  ('cabron',        false, 'lenguaje_ofensivo'),
  ('cabrón',        false, 'lenguaje_ofensivo'),
  ('chinga',        false, 'lenguaje_ofensivo'),
  ('chingad',       false, 'lenguaje_ofensivo'),
  ('verga',         false, 'lenguaje_ofensivo'),
  ('mames',         false, 'lenguaje_ofensivo'),
  ('mamada',        false, 'lenguaje_ofensivo'),
  ('joto',          false, 'lenguaje_ofensivo'),
  ('marica',        false, 'lenguaje_ofensivo'),
  ('puto',          false, 'lenguaje_ofensivo'),
  ('puta',          false, 'lenguaje_ofensivo'),
  ('perra',         false, 'lenguaje_ofensivo'),
  ('zorra',         false, 'lenguaje_ofensivo'),
  ('imbecil',       false, 'lenguaje_ofensivo'),
  ('imbécil',       false, 'lenguaje_ofensivo'),
  ('naco',          false, 'lenguaje_ofensivo'),
  ('mierda',        false, 'lenguaje_ofensivo'),
  ('culero',        false, 'lenguaje_ofensivo'),
  ('pinche',        false, 'lenguaje_ofensivo'),
  ('wey pendej',    false, 'lenguaje_ofensivo'),
  -- términos sexuales explícitos
  ('follar',        false, 'contenido_sexual'),
  ('porno',         false, 'contenido_sexual'),
  ('nudes',         false, 'contenido_sexual'),
  ('tetas',         false, 'contenido_sexual'),
  ('semen',         false, 'contenido_sexual'),
  ('masturb',       false, 'contenido_sexual')
on conflict (lower(patron)) do nothing;

-- Verificación
select count(*) as total_palabras_bloqueadas from palabras_bloqueadas;
