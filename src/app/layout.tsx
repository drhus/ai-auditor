import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AiAuditor — The Verified Fact Stamp about your agent",
  description:
    "Compliance and regulation conformity for AI agents — anchored on chain. EU AI Act, NIST AI RMF, in minutes.",
  openGraph: {
    title: "AiAuditor — The Verified Fact Stamp about your agent",
    description:
      "Compliance and regulation conformity for AI agents — anchored on chain.",
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
