export const metadata = { title: "Código de conducta — El Aula Informa" };

export default function CodigoDeConducta() {
  return (
    <div className="flex max-w-prose flex-col gap-4">
      <h1 className="text-3xl">Código de conducta</h1>
      <p>Reglas simples para que esto funcione para todos:</p>
      <ul className="list-disc space-y-2 pl-5">
        <li>Sé respetuoso. Se vale no estar de acuerdo, no se vale insultar.</li>
        <li>No publiques datos personales de nadie (teléfonos, domicilios, fotos de credenciales de otras personas).</li>
        <li>Las denuncias deben ser sobre hechos, con el mayor detalle posible — no rumores.</li>
        <li>Un solo testimonio o denuncia por situación: evita repetir lo mismo varias veces.</li>
        <li>El anonimato es para protegerte, no para inventar cosas: sigue habiendo revisión.</li>
      </ul>
      <h2 className="mt-2 text-xl">¿Qué pasa si no se cumple?</h2>
      <p>
        El contenido reportado varias veces por la comunidad se oculta automáticamente y el
        equipo lo revisa. Si algo tuyo se oculta, puedes escribirnos para pedir que lo revisen
        de nuevo.
      </p>
    </div>
  );
}
