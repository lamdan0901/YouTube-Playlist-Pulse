import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsOfService() {
  return (
    <main className="page-shell py-7 sm:py-12">
      <Link className="text-sm underline underline-offset-4" href="/">Back to Playlist Pulse</Link>
      <article className="panel mt-4 space-y-6 p-5 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
        <p>By using Playlist Pulse, you agree to these terms and to be bound by the <a className="underline" href="https://www.youtube.com/t/terms">YouTube Terms of Service</a>.</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Playlist actions</h2>
          <p>Use Playlist Pulse with a YouTube account you are authorized to manage. When you ask the app to create, populate, or delete a playlist, it performs that action on your connected YouTube account. New playlists are created as private. You can manage them on YouTube.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Google access and privacy</h2>
          <p>You can stop using the app at any time and revoke its connection to your YouTube account. The <Link className="underline" href="/privacy">Privacy Policy</Link> describes the data the app uses and how to remove access.</p>
        </section>
      </article>
    </main>
  );
}
