export const metadata = { title: "Preguntas frecuentes — El Aula Informa" };

const PREGUNTAS = [
  {
    q: "¿Es anónimo?",
    a: "Tú decides. Al publicar un testimonio puedes marcar «publicar como anónimo» y ni tu alias se muestra. Si no lo marcas, se ve tu alias (nunca tu nombre real ni tu correo).",
  },
  {
    q: "¿Cómo saben que soy alumno de la UTHH?",
    a: "Entras con tu correo institucional. Te mandamos un enlace de un solo uso a ese correo; solo puedes publicar después de abrirlo.",
  },
  {
    q: "¿Qué pasa con mis datos?",
    a: "Guardamos lo mínimo necesario. No compartimos tu correo ni tu identidad real con nadie fuera del equipo que modera.",
  },
  {
    q: "¿Lo ve la rectoría o la SEPH?",
    a: "El contenido público (muro, avisos, propuestas) lo puede ver cualquiera, incluidas las autoridades. Tu identidad, no.",
  },
  {
    q: "Ya no soy alumno activo (di de baja o egresé), ¿qué pasa con mi cuenta?",
    a: "Puedes seguir consultando todo, pero ya no puedes publicar, votar, firmar ni denunciar.",
  },
];

export default function PreguntasFrecuentes() {
  return (
    <div className="flex max-w-prose flex-col gap-4">
      <h1 className="text-3xl">Preguntas frecuentes</h1>
      <div className="flex flex-col gap-4">
        {PREGUNTAS.map((p) => (
          <div key={p.q} className="border-b border-borde pb-4">
            <h3 className="mb-1 font-semibold text-verde-oscuro">{p.q}</h3>
            <p className="text-sm text-tinta-suave">{p.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
