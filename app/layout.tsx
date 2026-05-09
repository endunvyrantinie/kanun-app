import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kanun — Malaysian HR Law, played",
  description:
    "Master Malaysia's Employment Act 1955 and the Sabah & Sarawak Labour Ordinances through 1-minute games.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-ink antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
