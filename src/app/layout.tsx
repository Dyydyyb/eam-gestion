import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EAM — Escuela de Manejo | Florencio Varela | Turnos Online & Gestión",
  description: "Academia de manejo líder en Florencio Varela, Buenos Aires. Clases prácticas individuales, autos con doble comando y reserva de turnos online en tiempo real.",
  icons: {
    icon: "/assets/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${plusJakartaSans.variable}`}>
      <body className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
