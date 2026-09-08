import type { Db } from "../../../shared/db/client";
import { DenunciasRepository } from "../infrastructure/denuncias.repository";
import { AppError } from "../../../shared/http/error";
import { asegurarLimiteDiario } from "../../contenido/core/limite-diario";

/**
 * Alto riesgo: queda `en_revision` y requiere aprobación manual del equipo
 * antes de publicarse. No hay auto-publicación.
 */
export async function crearDenuncia(
  db: Db,
  input: { autorId: string; categoriaId: string; texto: string; esAnonimo: boolean; esCuentaOficial: boolean },
) {
  if (input.texto.trim().length < 20) {
    throw new AppError(400, "DENUNCIA_MUY_CORTA", "Describe el caso con más detalle (mínimo 20 caracteres).");
  }
  await asegurarLimiteDiario(db, input.autorId, input.esCuentaOficial);
  return new DenunciasRepository(db).crear(input);
}
