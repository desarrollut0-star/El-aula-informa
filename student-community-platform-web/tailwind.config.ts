import type { Config } from "tailwindcss";

/**
 * Tokens tomados del boceto movimientoEscolar.html: verde del movimiento
 * (SUTUTEH) + papel de boletín. La paleta se conserva; lo nuevo son
 * sombras, radios y movimiento, todo en CSS (sin librerías de animación)
 * y animando solo transform/opacity para que se sienta fluido en celular.
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
      boxShadow: {
        tarjeta: "0 1px 2px rgba(27, 36, 32, 0.04), 0 1px 3px rgba(27, 36, 32, 0.06)",
        elevada: "0 6px 16px -4px rgba(27, 36, 32, 0.10), 0 2px 6px -2px rgba(27, 36, 32, 0.06)",
        flotante: "0 16px 40px -12px rgba(18, 53, 34, 0.28), 0 4px 12px -4px rgba(18, 53, 34, 0.10)",
      },
      transitionTimingFunction: {
        suave: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
      keyframes: {
        aparecer: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        "aparecer-suave": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        menu: {
          "0%": { opacity: "0", transform: "translateY(-4px) scale(0.97)" },
          "100%": { opacity: "1", transform: "none" },
        },
        conteo: {
          "0%": { opacity: "0.3", transform: "translateY(-35%)" },
          "100%": { opacity: "1", transform: "none" },
        },
      },
      animation: {
        aparecer: "aparecer 0.38s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "aparecer-suave": "aparecer-suave 0.25s ease-out both",
        pagina: "aparecer 0.32s cubic-bezier(0.2, 0.8, 0.2, 1) backwards",
        menu: "menu 0.16s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        conteo: "conteo 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
