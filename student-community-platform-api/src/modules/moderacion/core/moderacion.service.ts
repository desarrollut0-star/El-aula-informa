import { eq, sql } from "drizzle-orm";
import type { Db } from "../../../shared/db/client";
import { reportesContenido, accionesModeracion } from "../schema";
import { contenidos } from "../../contenido/schema";
import { publish } from "../../../shared/events/bus";
import { moderarTexto, type OpcionesModeracion } from "./moderar";
import type { MotivoReporte } from "./moderacion.types";

const UMBRAL_AUTO_OCULTADO = 5;

export class ModeracionService {
  constructor(private readonly db: Db) {}

  /** Las 3 capas: filtro local + OpenAI + Hugging Face + LLM propio. */
  revisarTextoAutomatico(texto: string, opts?: OpcionesModeracion) {
    return moderarTexto(this.db, texto, opts);
  }

  async registrarAccion(
    contenidoId: string | null,
    comentarioId: string | null,
    accion: "ocultado_automatico" | "ocultado_por_reportes",
    razon: string,
  ) {
    await this.db.insert(accionesModeracion).values({ contenidoId, comentarioId, accion, razon });
  }

  /**
   * Inserta el reporte. El trigger `fn_contar_reportes` actualiza
   * `contenidos.total_reportes`; aquí solo lo LEEMOS para decidir el umbral.
   */
  async reportar(
    objetivo: "contenido" | "comentario",
    objetivoId: string,
    reportadoPor: string,
    motivo: MotivoReporte,
    detalle?: string,
  ) {
    await this.db.insert(reportesContenido).values({
      contenidoId: objetivo === "contenido" ? objetivoId : null,
      comentarioId: objetivo === "comentario" ? objetivoId : null,
      reportadoPor,
      motivo,
      detalle,
    });

    let total = 0;
    if (objetivo === "contenido") {
      const [fila] = await this.db
        .select({ n: contenidos.totalReportes })
        .from(contenidos)
        .where(eq(contenidos.id, objetivoId));
      total = fila?.n ?? 0;
    } else {
      const [fila] = await this.db
        .select({ n: sql<number>`count(*)::int` })
        .from(reportesContenido)
        .where(eq(reportesContenido.comentarioId, objetivoId));
      total = fila?.n ?? 0;
    }

    if (total >= UMBRAL_AUTO_OCULTADO) {
      await this.registrarAccion(
        objetivo === "contenido" ? objetivoId : null,
        objetivo === "comentario" ? objetivoId : null,
        "ocultado_por_reportes",
        `${total} reportes de la comunidad`,
      );
      await publish(this.db, {
        type: "ContenidoReportadoNVeces",
        payload: { objetivo, objetivoId, reportes: total },
      });
    }

    return { totalReportes: total, autoOcultado: total >= UMBRAL_AUTO_OCULTADO };
  }
}
