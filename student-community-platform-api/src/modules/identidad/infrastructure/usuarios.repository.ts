import { eq } from "drizzle-orm";
import type { Db } from "../../../shared/db/client";
import { usuarios } from "../schema";
import { Rol } from "../domain/rol";

export class UsuariosRepository {
  constructor(private readonly db: Db) {}

  async buscarPorId(usuarioId: string) {
    const [fila] = await this.db.select().from(usuarios).where(eq(usuarios.id, usuarioId)).limit(1);
    return fila ?? null;
  }

  /** El alumno elige su programa en el primer acceso. */
  async completarPerfil(usuarioId: string, programaId: string) {
    await this.db.update(usuarios).set({ programaId }).where(eq(usuarios.id, usuarioId));
  }

  /** Registra en la BD que el alumno aceptó los términos y su versión. */
  async aceptarTerminos(usuarioId: string, version: string) {
    await this.db
      .update(usuarios)
      .set({ aceptoTerminosEn: new Date(), versionTerminos: version })
      .where(eq(usuarios.id, usuarioId));
  }

  async actualizarRol(usuarioId: string, rol: Rol) {
    await this.db.update(usuarios).set({ rol }).where(eq(usuarios.id, usuarioId));
  }
}
