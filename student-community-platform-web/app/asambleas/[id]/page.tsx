export const metadata = { title: "Asamblea — El Aula Informa" };

/** Cascarón: falta el módulo de backend (asambleas + asamblea_acuerdos). */
export default async function DetalleAsamblea({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-3xl">Asamblea</h1>
      <p className="text-sm text-tinta-suave">ID: {id}</p>
      <p className="max-w-prose text-tinta-suave">
        Aquí irán la modalidad, el orden del día, la minuta y los acuerdos con su seguimiento
        (responsable, fecha de compromiso, cumplido). Próximamente.
      </p>
    </div>
  );
}
