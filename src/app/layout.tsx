import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YouTube Playlist Pulse",
  description: "Generate a playlist from your YouTube subscriptions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased grid place-items-center h-screen">
        {children}
      </body>
    </html>
  );
}
