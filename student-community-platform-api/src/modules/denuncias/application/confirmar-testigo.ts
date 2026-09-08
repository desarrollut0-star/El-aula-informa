import type { Db } from "../../../shared/db/client";
import { DenunciasRepository } from "../infrastructure/denuncias.repository";
import { publish } from "../../../shared/events/bus";
import { AppError } from "../../../shared/http/error";

/** «Fui testigo» / «Confirmo». Publica el evento al cruzar el umbral. */
export async function confirmarTestigo(db: Db, contenidoId: string, usuarioId: string) {
  const repo = new DenunciasRepository(db);
  const denuncia = await repo.buscarPorContenidoId(contenidoId);
  if (!denuncia) throw new AppError(404, "DENUNCIA_NO_ENCONTRADA", "La denuncia no existe.");

  if (!(await repo.registrarConfirmacion(contenidoId, usuarioId))) {
    throw new AppError(409, "YA_CONFIRMASTE", "Ya confirmaste esta denuncia.");
  }

  if (denuncia.registrarConfirmacion()) {
    await repo.marcarVerificada(contenidoId);
    await publish(db, {
      type: "DenunciaAlcanzoUmbral",
      payload: { contenidoId, autorId: denuncia.autorId, confirmaciones: denuncia.confirmaciones },
    });
  }

  return { confirmaciones: denuncia.confirmaciones, noVerificada: denuncia.noVerificada };
}
