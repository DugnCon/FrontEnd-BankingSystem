// app/layout.tsx
export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Inter, IBM_Plex_Serif } from 'next/font/google';
import { Toaster } from 'sonner'; // THÊM IMPORT NÀY
import './globals.css';

// Fonts
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-ibm-plex-serif',
});

// Metadata cho SEO + PWA
export const metadata: Metadata = {
  title: 'Horizon',
  description: 'Horizon is a modern banking platform for everyone.',
  icons: {
    icon: '/icons/logo.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Horizon Banking',
  },
};

// Viewport riêng cho mobile
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0066cc',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <head>
        <meta name="theme-color" content="#0066cc" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={`${inter.variable} ${ibmPlexSerif.variable}`}>
        {children}
        {/* THÊM TOASTER VÀO ĐÂY - ĐẶT CUỐI CÙNG TRONG BODY */}
        <Toaster 
          position="top-right"
          richColors
          closeButton
          expand={true}
          duration={3000}
        />
      </body>
    </html>
  );
}