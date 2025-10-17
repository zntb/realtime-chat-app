import type React from 'react';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const _geist = Geist({ subsets: ['latin'] });
const _geistMono = Geist_Mono({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChatFlow - Real-time Messaging',
  description:
    'Connect instantly with real-time messaging, group chats, and file sharing',
  generator: 'Next.js',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={`${_geist.className} ${_geistMono.className}`}
      suppressHydrationWarning
    >
      <body className={`font-sans antialiased`}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
