import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_ORIGIN || 'http://localhost:3000'),
  title: 'OpenFilings — Public company intelligence',
  description: 'Explore SEC-verified financial performance and filings for public companies.',
  openGraph: {
    title: 'OpenFilings',
    description: 'Public company intelligence, sourced from SEC EDGAR.',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'OpenFilings public company intelligence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenFilings',
    description: 'Public company intelligence, sourced from SEC EDGAR.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
