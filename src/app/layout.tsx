import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "./providers";

const sans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Patungan — Split Bill Bareng Temen",
  description:
    "Catat bill dari beberapa tempat dalam satu sesi nongkrong, scan struk, dan langsung tahu siapa transfer ke siapa.",
  applicationName: "Patungan",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Patungan",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-icon-180.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#14b8a6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${sans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="bg-muted/30 min-h-full">
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
