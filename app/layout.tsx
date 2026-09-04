import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RiskRadar — Exploited Vulnerability Intelligence',
  description: "Prioritize remediation using CISA's catalog of vulnerabilities known to be actively exploited.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
