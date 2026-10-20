import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReGrade | E-waste triage prototype",
  description:
    "Explore ReGrade, a non-destructive smartphone and USB charger triage prototype.",
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
