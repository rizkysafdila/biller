import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
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
};

export const viewport: Viewport = {
  themeColor: "#14b8a6",
  width: "device-width",
  initialScale: 1,
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
      </body>
    </html>
  );
}
