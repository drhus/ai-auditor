import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AiAuditor — The audit layer for AI agents",
  description:
    "Audit ERC-8004 AI agents against the EU AI Act and NIST AI RMF. On-chain, in minutes.",
  openGraph: {
    title: "AiAuditor",
    description:
      "Audit ERC-8004 AI agents against the EU AI Act. On-chain, in minutes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
