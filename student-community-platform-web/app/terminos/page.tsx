export const metadata = { title: "Términos de uso — El Aula Informa" };

/** Borrador. Se aceptan en el primer acceso (usuarios.acepto_terminos_en). */
export default function Terminos() {
  return (
    <div className="flex max-w-prose flex-col gap-4">
      <h1 className="text-3xl">Términos de uso</h1>
      <p className="text-sm text-tinta-suave">Borrador — pendiente de revisión.</p>

      <ul className="list-disc space-y-2 pl-5 text-sm">
        <li>El Aula Informa es un proyecto estudiantil independiente. No representa a la UTHH ni al SUTUTEH.</li>
        <li>Solo pueden publicar los alumnos con correo institucional confirmado.</li>
        <li>Aceptas el <a href="/codigo-de-conducta" className="underline">código de conducta</a>: respeto, nada de datos personales de terceros, denuncias sobre hechos.</li>
        <li>El equipo puede ocultar contenido que incumpla las reglas; puedes apelar la decisión.</li>
        <li>Las denuncias que nombran personas o áreas se publican con la etiqueta «sin confirmar» y con derecho de réplica.</li>
        <li>El uso de la plataforma implica aceptar el <a href="/privacidad" className="underline">aviso de privacidad</a>.</li>
      </ul>
    </div>
  );
}
