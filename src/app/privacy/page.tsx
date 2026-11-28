import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPolicy() {
  const supportEmail = process.env.SUPPORT_EMAIL?.trim();

  return (
    <main className="page-shell py-7 sm:py-12">
      <Link className="text-sm underline underline-offset-4" href="/">Back to Playlist Pulse</Link>
      <article className="panel mt-4 space-y-6 p-5 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p>Playlist Pulse uses YouTube API Services to build private playlists from your subscriptions or the video links you provide. Google handles sign-in under the <a className="underline" href="https://policies.google.com/privacy">Google Privacy Policy</a>.</p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Data we access and use</h2>
          <p>When you connect your YouTube account, the app can read your subscriptions, playlist details, and information about videos such as titles and durations. It uses this information to find recent uploads, show playlists, and create, populate, or delete playlists when you ask. Video links you enter are used to look up the videos and add them to your playlist.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Storage and sharing</h2>
          <p>Subscription and playlist results are held in your current browser page. Playlist Pulse uses an encrypted session cookie to stay connected for up to 30 days. A short-lived access token is held in browser memory so the page can call YouTube. The app sends authorization and playlist requests to Google and YouTube to perform the actions you choose. The hosting provider may process connection details such as your IP address to serve the site.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Disconnect and delete data</h2>
          <p>Choose <strong>Account → Disconnect YouTube</strong> to revoke access and clear the app’s session and temporary data on this device. You can also remove access through <a className="underline" href="https://security.google.com/settings/security/permissions">Google Account permissions</a>. Playlists you created stay on YouTube. You can delete them in YouTube or with the app’s playlist controls before disconnecting.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Privacy questions and requests</h2>
          {supportEmail ? (
            <p>For privacy questions or requests to delete data, email <a className="underline wrap-anywhere" href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
          ) : (
            <p>For privacy questions or to request a private contact channel, <a className="underline" href="https://github.com/lamdan0901/yt-subs-playlist-creator/issues">open a support issue</a>. Keep account details and other personal information out of public issues.</p>
          )}
        </section>
      </article>
    </main>
  );
}
