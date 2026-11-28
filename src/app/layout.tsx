import type { Metadata } from "next";
import Link from "next/link";
import { appName } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: appName, template: `%s | ${appName}` },
  description: "Generate a playlist from your YouTube subscriptions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground antialiased">
        {children}
        <footer className="mt-auto border-t border-line">
          <nav aria-label="Legal" className="page-shell flex flex-wrap gap-x-5 text-sm text-muted">
            <Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/privacy">Privacy Policy</Link>
            <Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/terms">Terms of Service</Link>
            <a className="inline-flex min-h-11 items-center underline underline-offset-4" href="https://www.youtube.com/t/terms">YouTube Terms of Service</a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
