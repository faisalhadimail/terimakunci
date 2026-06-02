import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TerimaKunci - Jual Beli Properti Terpercaya",
    template: "%s | TerimaKunci",
  },
  description: "Temukan properti impian Anda di TerimaKunci. Jual beli rumah, tanah, ruko, apartemen, dan properti lainnya dengan harga terbaik.",
  keywords: ["properti", "jual rumah", "beli rumah", "tanah", "ruko", "apartemen", "kost", "TerimaKunci", "properti Indonesia", "jual beli properti"],
  authors: [{ name: "TerimaKunci" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "TerimaKunci - Jual Beli Properti Terpercaya",
    description: "Temukan properti impian Anda. Rumah, tanah, ruko, apartemen, dan properti lainnya dengan harga terbaik.",
    url: "https://terimakunci.com",
    siteName: "TerimaKunci",
    type: "website",
    locale: "id_ID",
  },
  twitter: {
    card: "summary_large_image",
    title: "TerimaKunci - Jual Beli Properti Terpercaya",
    description: "Temukan properti impian Anda. Rumah, tanah, ruko, apartemen, dan properti lainnya dengan harga terbaik.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
