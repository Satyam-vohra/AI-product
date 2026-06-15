import type { Metadata } from "next";
import { AnalyticsBeacon } from "@/components/mantis/AnalyticsBeacon";
import { ThemeProvider } from "@/hooks/useTheme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mantis AI - Intelligent Product Support & Diagnostic Platform",
  description:
    "AI-powered SaaS platform for product diagnostics, troubleshooting, knowledge management, and predictive maintenance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AnalyticsBeacon />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
