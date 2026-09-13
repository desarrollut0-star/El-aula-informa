/**
 * Íconos de trazo en SVG en línea: pesan casi nada, heredan el color del
 * texto (currentColor) y se ven igual en todos los sistemas, a diferencia
 * de los emojis.
 */
const TRAZOS = {
  casa: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  capas: "M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM3 7v10M21 7v10",
  lista: "M4 6h16M4 12h16M4 18h10",
  megafono: "M3 11v2a1 1 0 0 0 1 1h2l6 4V6L6 10H4a1 1 0 0 0-1 1zM16 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12",
  usuario: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  usuarios: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14a7 7 0 0 1 4 6",
  entrar: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
  salir: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  chevron: "m6 9 6 6 6-6",
  flechaIzq: "M19 12H5M12 19l-7-7 7-7",
  flechaDer: "M5 12h14M12 5l7 7-7 7",
  bandera: "M5 21V4M5 15s1.2-1 4-1 4.8 2 7.5 2S20 15 20 15V4s-1.2 1-3.5 1S12 3 9 3 5 4 5 4",
  candado: "M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V7a4 4 0 0 1 8 0v4",
  comentario: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  pulgar:
    "M7 10v11M7 10l4-8a2.5 2.5 0 0 1 3 2.5V9h5.2a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 17.8 21H7M7 10H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3",
  mas: "M5 12h.01M12 12h.01M19 12h.01",
  calendario: "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM3 10h18M8 2v4M16 2v4",
  ubicacion: "M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  cita: "M6 7h4v4c0 3-1.5 5-4 6M14 7h4v4c0 3-1.5 5-4 6",
  periodico: "M4 5h12v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2zM16 9h4v10a2 2 0 0 1-2 2M8 9h4M8 13h4M8 17h2",
  foco: "M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z",
  grafica: "M4 20V10M10 20V4M16 20v-7M2 20h20",
  escudo: "M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6zM12 8v4M12 16h.01",
  pluma: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  campana: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0",
  respuesta: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v5",
  basura: "M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  check: "M20 6 9 17l-5-5",
  enviar: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  estrella: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({
  nombre,
  className = "h-4 w-4",
  grosor = 1.8,
}: {
  nombre: NombreIcono;
  className?: string;
  grosor?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosor}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
