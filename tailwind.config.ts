import type { Config } from "tailwindcss";

// Configuración mobile-first: el diseño base (sin prefijo) apunta a pantallas
// de operador (~360-430px de ancho). Los breakpoints hacia arriba (sm/md/lg/xl)
// se usan para escalar hacia las vistas de escritorio (/admin/*).
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    // Se sobreescriben los breakpoints por defecto de Tailwind para dejar
    // explícito el punto de quiebre móvil -> escritorio (md = 768px = laptop).
    screens: {
      xs: "375px",
      sm: "480px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        // Paleta de estatus de orden de servicio (public.orden_estatus)
        estatus: {
          cotizado: "#94a3b8",
          confirmado: "#38bdf8",
          pagado: "#0ea5e9",
          espera: "#f59e0b",
          progreso: "#3b82f6",
          finalizado: "#22c55e",
          cancelado: "#ef4444",
        },
        // Acciones grandes de la app del operador
        action: {
          start: "#16a34a", // Iniciar Servicio
          "start-hover": "#15803d",
          stop: "#dc2626", // Finalizar Servicio
          "stop-hover": "#b91c1c",
        },
        cobranza: {
          ok: "#ecfdf5",
          "ok-border": "#22c55e",
          proximo: "#fffbeb",
          "proximo-border": "#f59e0b",
          vencido: "#fef2f2",
          "vencido-border": "#ef4444",
        },
      },
      spacing: {
        // Alto mínimo recomendado para botones táctiles primarios (operador,
        // uso a plena luz del día / con guantes / en movimiento).
        "touch-lg": "3.5rem", // 56px
        "touch-xl": "4.25rem", // 68px
        "safe-b": "env(safe-area-inset-bottom)",
        "safe-t": "env(safe-area-inset-top)",
      },
      maxWidth: {
        "mobile-shell": "480px",
      },
      fontSize: {
        // Tamaños pensados para lectura rápida ("scannable") bajo el sol
        "scan-lg": ["1.25rem", { lineHeight: "1.75rem", fontWeight: "700" }],
        "scan-xl": ["1.75rem", { lineHeight: "2rem", fontWeight: "800" }],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.08)",
        "action-btn": "0 6px 16px -4px rgb(0 0 0 / 0.35)",
      },
      animation: {
        "pulse-rec": "pulse-rec 1.4s ease-in-out infinite",
      },
      keyframes: {
        "pulse-rec": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
