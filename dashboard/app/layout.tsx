import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReGrade | Triage dashboard",
  description:
    "Monitor e-waste diagnostics and inventory from ReGrade test stations.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
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
