# 0004 — Eventos de integración: outbox en PostgreSQL, no Redis/Queues por ahora

## Estado
Aceptado (revisable si el volumen de eventos crece)

## Contexto
El repo de referencia usa Redis como bus de mensajes entre módulos.
Cloudflare ofrece **Queues**, su equivalente nativo, pero requiere el plan
**Workers Paid** (~5 USD/mes). El proyecto opera en capa gratuita mientras
sea posible.

## Decisión
Los eventos de integración se publican con **patrón outbox** directamente
en PostgreSQL (tabla `eventos_integracion`): el módulo productor inserta
la fila dentro de la misma transacción que el cambio que la origina. Un
*dispatcher* (`src/shared/events/dispatcher.ts`), disparado por un Cron
Trigger de Cloudflare cada pocos minutos, lee los eventos pendientes, los
entrega a los `eventHandlers` de los módulos suscritos y los marca como
procesados.

## Consecuencias

- Sin costo adicional ni dependencia de infraestructura nueva.
- Los eventos no son instantáneos: hay una latencia de hasta el intervalo
  del Cron Trigger (unos minutos). Aceptable para este dominio (nada aquí
  necesita reacción en tiempo real por debajo de eso).
- Si el volumen de eventos crece o se necesita entrega casi inmediata, la
  migración a **Cloudflare Queues** solo toca `bus.ts` y `dispatcher.ts`;
  los módulos, que solo conocen la interfaz `AppModule.eventHandlers`, no
  cambian.
