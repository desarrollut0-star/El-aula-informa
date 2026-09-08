# 0001 — Monolito modular en lugar de microservicios

## Estado
Aceptado

## Contexto
Comunidad UTHH la construye un equipo pequeño de estudiantes, con tiempo y
capacidad de operación limitados, para un caso de uso con tráfico a picos
(momentos políticos del conflicto) y mayoritariamente de lectura. Se
necesita una arquitectura fácil de razonar, desplegar y mantener, que no
exija coordinar despliegues de varios servicios ni una malla de red entre
ellos.

## Decisión
Un solo backend desplegable, dividido internamente en **módulos aislados**
(`src/modules/*`) que exponen un contrato común (`AppModule`) y se
comunican **solo por eventos de integración** o por API HTTP — nunca
importándose código entre sí. Se adopta el patrón del repositorio de
referencia [`mgce/modular-monolith-nodejs`](https://github.com/mgce/modular-monolith-nodejs).

Cada módulo elige uno de dos niveles de complejidad:

- **CRUD** — para módulos con reglas de negocio simples (firmas, muro,
  contenido, moderación, notificaciones).
- **Clean Architecture** — para módulos con dominio rico (identidad,
  denuncias), con dependencia estricta `api → infrastructure →
  application → domain`.

## Consecuencias

- Un solo despliegue, una sola base de datos, un solo runtime que vigilar.
- Si un módulo crece demasiado (p. ej. muro), se puede extraer a su propio
  servicio más adelante sin rehacer el modelo de datos ni los contratos de
  evento.
- Exige disciplina: ningún módulo debe importar directamente de otro. La
  única vía de comunicación es el bus de eventos o la API pública.
