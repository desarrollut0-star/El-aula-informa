import { eq } from "drizzle-orm";
import type { Db } from "../../../shared/db/client";
import { denuncias, denunciaConfirmaciones } from "../schema";
import { contenidos } from "../../contenido/schema";
import { Denuncia } from "../domain/denuncia";

export class DenunciasRepository {
  constructor(private readonly db: Db) {}

  /** Crea el `contenido` (tipo=denuncia, en_revision) + la fila `denuncias`. */
  async crear(input: { autorId: string; categoriaId: string; texto: string; esAnonimo: boolean }) {
    return this.db.transaction(async (tx) => {
      const [contenido] = await tx
        .insert(contenidos)
        .values({
          tipo: "denuncia",
          autorId: input.autorId,
          cuerpo: input.texto,
          esAnonimo: input.esAnonimo,
          estado: "en_revision",
        })
        .returning();

      await tx.insert(denuncias).values({ contenidoId: contenido.id, categoriaId: input.categoriaId });
      return contenido;
    });
  }

  async buscarPorContenidoId(contenidoId: string): Promise<Denuncia | null> {
    const [fila] = await this.db
      .select({
        contenidoId: denuncias.contenidoId,
        autorId: contenidos.autorId,
        noVerificada: denuncias.noVerificada,
        total: denuncias.totalConfirmaciones,
      })
      .from(denuncias)
      .innerJoin(contenidos, eq(contenidos.id, denuncias.contenidoId))
      .where(eq(denuncias.contenidoId, contenidoId))
      .limit(1);

    if (!fila) return null;
    return new Denuncia(fila.contenidoId, fila.autorId, fila.noVerificada, fila.total);
  }

  /** Idempotente. El trigger `fn_contar_confirmaciones` ajusta el contador. */
  async registrarConfirmacion(contenidoId: string, usuarioId: string): Promise<boolean> {
    const filas = await this.db
      .insert(denunciaConfirmaciones)
      .values({ denunciaId: contenidoId, usuarioId })
      .onConflictDoNothing({ target: [denunciaConfirmaciones.denunciaId, denunciaConfirmaciones.usuarioId] })
      .returning();
    return filas.length > 0;
  }

  async marcarVerificada(contenidoId: string) {
    await this.db.update(denuncias).set({ noVerificada: false }).where(eq(denuncias.contenidoId, contenidoId));
  }
}
