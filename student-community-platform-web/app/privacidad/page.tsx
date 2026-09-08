export const metadata = { title: "Aviso de privacidad — El Aula Informa" };

/** Borrador. Revisar con alguien de Derecho antes de publicar en serio. */
export default function Privacidad() {
  return (
    <div className="flex max-w-prose flex-col gap-4">
      <h1 className="text-3xl">Aviso de privacidad</h1>
      <p className="text-sm text-tinta-suave">Borrador — pendiente de revisión legal.</p>

      <h2 className="mt-2 text-xl">Qué datos guardamos</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li>Tu correo institucional (lo administra Supabase Auth; no se muestra a nadie).</li>
        <li>Un alias público aleatorio, tu programa y tu rol.</li>
        <li>Tu matrícula, únicamente como HMAC (no se puede revertir a la matrícula).</li>
        <li>Lo que publicas, tus reacciones y tus confirmaciones de denuncia.</li>
      </ul>

      <h2 className="mt-2 text-xl">Terceros que tratan datos</h2>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        <li><strong>Supabase</strong> — base de datos y autenticación.</li>
        <li><strong>Cloudinary</strong> — imágenes y evidencia de denuncias.</li>
        <li><strong>APIs de moderación</strong> (OpenAI / Perspective) — revisan el texto publicado.</li>
        <li><strong>Vercel / Cloudflare</strong> — alojamiento del sitio y la API.</li>
      </ul>

      <h2 className="mt-2 text-xl">Tus derechos (LFPDPPP)</h2>
      <p className="text-sm">
        Puedes pedir que se borre tu cuenta: se anonimiza (tu alias y tu vínculo con el padrón
        se eliminan) y tu contenido queda como anónimo. Escríbenos desde{" "}
        <a href="/nosotros" className="underline">contacto</a>.
      </p>
    </div>
  );
}
