import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Szkolny Helpdesk",
  description: "System zgłaszania usterek w szkole",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <Providers>
          <SiteHeader />
          <main className="container py-6 sm:py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
