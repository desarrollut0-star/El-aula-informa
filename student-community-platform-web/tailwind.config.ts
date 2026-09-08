import type { Config } from "tailwindcss";

/**
 * Tokens tomados del boceto movimientoEscolar.html: verde del movimiento
 * (SUTUTEH) + papel de boletín. Se mantienen los mismos nombres para que
 * el frontend real se sienta continuación del boceto, no un rediseño.
 */
export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        verde: { DEFAULT: "#1F5D3E", oscuro: "#123522", tenue: "#DCE6D6", linea: "#A9C4AA" },
        papel: { DEFAULT: "#EFEEE1", alt: "#E5E2D0" },
        tinta: { DEFAULT: "#1B2420", suave: "#4B564D" },
        ocre: { DEFAULT: "#9A6520", tenue: "#F0DFC4" },
        terracota: { DEFAULT: "#963A2C", tenue: "#F0D9D2" },
        borde: "#CFC7A9",
        blanco: { papel: "#F8F7F0" },
        nivel: { bajo: "#4B7A5A", medio: "#9A6520", alto: "#963A2C" },
      },
      fontFamily: {
        display: ["var(--font-barlow)", "Arial Narrow", "sans-serif"],
        sans: ["var(--font-public-sans)", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
