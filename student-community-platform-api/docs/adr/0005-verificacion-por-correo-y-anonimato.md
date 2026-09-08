# 0005 — Verificación por correo institucional (vía Supabase Auth) y anonimato

## Estado
Aceptado — actualiza la versión previa (que describía un magic link hecho a mano).

## Contexto
Antes: enlace de un solo uso hecho a mano (tabla `tokens_acceso`, envío con
Resend). Con la adopción de Supabase Auth (ADR 0003) eso ya lo hace Supabase.

## Decisión

**Verificación de identidad:**
- El alumno entra con `supabase.auth.signInWithOtp({ email })` y luego
  `verifyOtp({ email, token, type: 'email' })` con el **código de 8
  dígitos** que llega al correo (no un enlace). El dominio `@uthh.edu.mx`
  lo exige el trigger `fn_auth_validar_dominio` de la base (con una lista
  blanca corta para la cuenta de servicio del equipo).
- Aceptación de términos: `POST /identidad/aceptar-terminos` guarda
  `usuarios.acepto_terminos_en` y `version_terminos`. El middleware
  `requireRole` rechaza cualquier escritura sin esa aceptación.
- En el primer acceso, el alumno elige su programa educativo y acepta
  términos (`POST /identidad/completar-perfil` → `usuarios.programa_id`,
  `acepto_terminos_en`).
- El rol `verificado` / `no_verificado` lo determina el vínculo con el
  padrón (esquema `privado`), reconciliado por un Cron Trigger. Confirmar
  el correo institucional es necesario para tener cuenta; el padrón la
  puede degradar después si el alumno da de baja.

**Anonimato:**
- `contenidos.es_anonimo` (una columna, aplica a testimonios, propuestas y
  denuncias). Cuando es `true`, la consulta SQL devuelve `autor_alias:
  null` — el dato enmascarado nunca sale de la base.
- El autor sigue registrado (`contenidos.autor_id`) para rendición de
  cuentas ante moderación; no se expone a otros alumnos ni al público.
- Es anonimato **por publicación**, no por cuenta.

## Consecuencias
- Menos código propio de autenticación = menos superficie de error.
- Falta (fuera de alcance): rate limiting de "publicar", captcha en el alta
  (Supabase cubre parte), subida de evidencia a Supabase Storage.
