import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "REBA Procesos", template: "%s · REBA Procesos" },
  description: "Gestión, revisión y gobierno de procesos institucionales de Rebagliati Diplomados.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
