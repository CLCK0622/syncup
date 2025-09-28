
import type { Metadata } from "next";
import "./globals.scss";

export const metadata: Metadata = {
  title: "SyncUp",
  description: "Make time among people you care about.",
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
