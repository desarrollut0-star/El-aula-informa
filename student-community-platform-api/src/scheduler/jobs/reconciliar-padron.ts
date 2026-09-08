import { eq } from "drizzle-orm";
import type { Db } from "../../shared/db/client";
import { usuarios } from "../../modules/identidad/schema";
import { identidades, padronAlumnos } from "../../modules/identidad/schema";
import { Rol } from "../../modules/identidad/domain/rol";
import { publish } from "../../shared/events/bus";

/**
 * Compara el rol de cada usuario con su estatus vigente en el padrón
 * (esquema privado) y corrige: baja → no_verificado, reactivación →
 * verificado. La carga del padrón desde el listado oficial (matrículas
 * como HMAC + `cargas_padron`) es un proceso aparte.
 */
export async function reconciliarPadron(db: Db) {
  const filas = await db
    .select({
      usuarioId: usuarios.id,
      rolActual: usuarios.rol,
      estatusPadron: padronAlumnos.estatus,
    })
    .from(usuarios)
    .innerJoin(identidades, eq(identidades.usuarioId, usuarios.id))
    .innerJoin(padronAlumnos, eq(padronAlumnos.id, identidades.padronId));

  for (const fila of filas) {
    const deberiaSerVerificado = fila.estatusPadron === "activo";
    const esVerificado = fila.rolActual === Rol.Verificado;
    if (deberiaSerVerificado === esVerificado) continue;

    const nuevoRol = deberiaSerVerificado ? Rol.Verificado : Rol.NoVerificado;
    await db.update(usuarios).set({ rol: nuevoRol }).where(eq(usuarios.id, fila.usuarioId));
    await publish(db, {
      type: deberiaSerVerificado ? "AlumnoReactivado" : "AlumnoDadoDeBaja",
      payload: { usuarioId: fila.usuarioId },
    });
  }
}
