export const metadata = { title: "Nosotros — El Aula Informa" };

export default function Nosotros() {
  return (
    <div className="flex max-w-prose flex-col gap-4">
      <h1 className="text-3xl">¿Quiénes somos?</h1>
      <p>
        El Aula Informa es un espacio hecho por y para estudiantes de la Universidad Tecnológica
        de la Huasteca Hidalguense. Nació para que los alumnos tuviéramos un lugar donde
        enterarnos de lo que pasa, compartir cómo nos afecta el paro, y organizarnos.
      </p>
      <p>
        <strong>No es un órgano oficial</strong> de la UTHH ni del SUTUTEH. Es un proyecto
        independiente, mantenido por un grupo pequeño de estudiantes.
      </p>
      <h2 className="mt-2 text-xl">¿Quién lo mantiene?</h2>
      <p>
        Un núcleo de alumnos voluntarios revisa lo que se publica y mantiene la plataforma
        funcionando. Publican como la cuenta &laquo;Sociedad Estudiantil&raquo; para que se
        distinga de lo que publica cualquier alumno.
      </p>
      <h2 className="mt-2 text-xl">¿Cómo entro?</h2>
      <p>
        Con tu correo institucional. Te mandamos un enlace de acceso, sin necesidad de crear
        contraseña. Ver <a className="underline" href="/acceso">acceso</a>.
      </p>
    </div>
  );
}
