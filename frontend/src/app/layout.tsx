import type { Metadata } from 'next';
import './globals.css';

import { Inter } from 'next/font/google';
import { Inria_Sans } from 'next/font/google';

// If loading a variable font, you don't need to specify the font weight
const inter = Inter({ subsets: ['latin'] });
const inria_sans = Inria_Sans({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'kada',
  description: 'kpop formation generator',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inria_sans.className}>{children}</body>
    </html>
  );
}
