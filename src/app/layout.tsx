import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

const quicksand = Quicksand({ 
  subsets: ["latin"],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-quicksand',
  fallback: ['system-ui', 'sans-serif'],
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0F766E',
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: "Cohérence Cardiaque",
  description: "Exercices de respiration pour la cohérence cardiaque",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cohérence',
    startupImage: '/icon.png',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={quicksand.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Cohérence" />
      </head>
      <body className={`${quicksand.className} font-sans`}>{children}</body>
    </html>
  );
}
