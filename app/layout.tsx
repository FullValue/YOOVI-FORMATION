import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ToastProvider } from "@/components/ui/Toast";
import { DemoBanner } from "@/components/shell/DemoBanner";
import "./globals.css";

// Polices du site yoovi.fr (fichiers auto-hébergés repris du site)
const display = localFont({
  src: [
    { path: "../public/fonts/jakarta-500.woff2", weight: "500" },
    { path: "../public/fonts/jakarta-600-700.woff2", weight: "600 800" },
  ],
  variable: "--font-display",
  display: "swap",
});
const body = localFont({
  src: [
    { path: "../public/fonts/inter-500.woff2", weight: "400 500" },
    { path: "../public/fonts/inter-600.woff2", weight: "600 700" },
  ],
  variable: "--font-body",
  display: "swap",
});
const reading = localFont({
  src: [
    { path: "../public/fonts/inter-display-400.woff2", weight: "400" },
    { path: "../public/fonts/inter-display-500.woff2", weight: "500" },
    { path: "../public/fonts/inter-display-600.woff2", weight: "600" },
  ],
  variable: "--font-reading",
  display: "swap",
});

// Toutes les pages dépendent de la session : aucun pré-rendu statique.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Yoovi Formation", template: "%s · Yoovi Formation" },
  description: "L'espace de formation des partenaires Yoovi : découvrir, comprendre et maîtriser Yoovi.",
  robots: { index: false, follow: false },
  icons: { icon: "/brand/yoovi-logo.png", apple: "/brand/yoovi-logo.png" },
};

export const viewport: Viewport = {
  themeColor: "#F7F4FF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable} ${reading.variable}`}>
      <body>
        <a href="#contenu" className="sr-only z-[100] rounded-full bg-ink px-4 py-2 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
          Aller au contenu
        </a>
        <ToastProvider>
          <DemoBanner />
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
