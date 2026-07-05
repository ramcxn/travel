import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Ops",
  description: "App de operación turística: agenda de operadores y panel administrativo.",
};

// viewport-fit=cover + maximumScale=1 son clave para la app del operador:
// evita zoom accidental y permite usar env(safe-area-inset-*) en iPhones
// con notch / isla dinámica.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
