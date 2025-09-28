
import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "SyncUp",
  description: "Find common availability with your team.",
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
