"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useYouTubeAuth, useYouTubeApi } from "@/hooks";
import { CheckIcon, CopyIcon } from "@/app/icons";
import { Button, ProgressBar } from "@/components/ui";
import { GeneratedPlaylists } from "@/components/GeneratedPlaylists";
import { appName } from "@/lib/site";

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<
    { id: string; url: string; count: number }[]
  >([]);
  const [deletingPlaylistIds, setDeletingPlaylistIds] = useState<Set<string>>(
    new Set()
  );
  const [copiedVideos, setCopiedVideos] = useState<Set<number>>(new Set());
  const [videoLimit, setVideoLimit] = useState<number | string>(50);
  const [playlistSize, setPlaylistSize] = useState<number | string>(50);

  const {
    isAuthenticated,
    accessToken,
    authenticate,
    endSession,
    isValidating,
    authError,
    authBusy,
  } = useYouTubeAuth();
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const {
    isLoading,
    progress,
    progressStatus,
    failedVideos,
    generatePlaylist,
    generatePlaylistFromLinks,
    deletePlaylist,
    cancel,
  } = useYouTubeApi(accessToken);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [videoLinks, setVideoLinks] = useState("");

  const handleCreatePlaylistFromLinks = async () => {
    try {
      setError(null);
      setMessage(null);
      const links = videoLinks.split("\n").filter((link) => link.trim() !== "");
      if (links.length === 0) {
        setError("Please enter at least one YouTube video link.");
        return;
      }
      const pSize = Number(playlistSize) > 0 ? Number(playlistSize) : 50;
      const result = await generatePlaylistFromLinks(links, pSize);
      setMessage(
        `Playlist(s) created successfully! Added ${
          result.totalVideos - failedVideos.length
        } videos across ${result.playlists.length} playlist(s).`
      );
      setPlaylists(result.playlists);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create playlist";
      if (errorMessage !== "Operation cancelled") {
        setError(errorMessage);
      }
    }
  };

  const handleCopy = (title: string, index: number) => {
    navigator.clipboard.writeText(title);
    setCopiedVideos((prev) => new Set(prev).add(index));
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    try {
      setError(null);
      setMessage(null);
      setDeletingPlaylistIds((prev) => new Set(prev).add(playlistId));
      await deletePlaylist(playlistId);
      setPlaylists((prev) => prev.filter((playlist) => playlist.id !== playlistId));
      setMessage("Playlist deleted successfully.");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete playlist";
      if (errorMessage !== "Operation cancelled") {
        setError(errorMessage);
      }
    } finally {
      setDeletingPlaylistIds((prev) => {
        const next = new Set(prev);
        next.delete(playlistId);
        return next;
      });
    }
  };

  // Update document title with progress during playlist creation
  useEffect(() => {
    if (isLoading && progress > 0) {
      document.title = `${progress}% - ${appName}`;
    } else {
      document.title = appName;
    }

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = appName;
    };
  }, [isLoading, progress]);

  const handleCreatePlaylist = async () => {
    try {
      setError(null);
      setMessage(null);
      const limit = Number(videoLimit) > 0 ? Number(videoLimit) : 50;
      const pSize = Number(playlistSize) > 0 ? Number(playlistSize) : 50;
      const result = await generatePlaylist(limit, pSize);
      setMessage(
        `Playlist(s) created successfully! Added ${
          result.totalVideos - failedVideos.length
        } videos across ${result.playlists.length} playlist(s).`
      );
      setPlaylists(result.playlists);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create playlist";
      if (errorMessage !== "Operation cancelled") {
        setError(errorMessage);
      }
    }
  };

  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="page-shell flex min-h-[62px] items-center justify-between gap-3 sm:min-h-[68px]">
          <div className="flex items-center gap-2.5 font-bold">
            <span className="brand-mark" aria-hidden="true"><span /></span>
            <span>{appName}</span>
          </div>
          {isAuthenticated && !isValidating && (
            <details className="relative shrink-0">
              <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 rounded-lg px-3 text-sm font-semibold hover:bg-quiet">
                Account
                <span
                  aria-hidden="true"
                  className="size-[7px] -translate-y-0.5 rotate-45 border-r border-b"
                />
              </summary>
              <div className="absolute top-full right-0 z-10 mt-2 grid min-w-48 rounded-xl border border-line bg-surface p-1.5 shadow-lg">
                <Button variant="ghost" size="sm" className="justify-start" disabled={authBusy} onClick={authenticate}>
                  Switch account
                </Button>
                <Button variant="ghost" size="sm" className="justify-start" disabled={authBusy} onClick={() => endSession(false)}>
                  Sign out
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start text-danger"
                  disabled={authBusy}
                  onClick={() => {
                    if (window.confirm("Disconnect YouTube from Playlist Pulse? Your playlists will stay on YouTube.")) {
                      void endSession(true);
                    }
                  }}
                >
                  Disconnect YouTube
                </Button>
              </div>
            </details>
          )}
        </div>
      </header>

      <main className="page-shell space-y-[18px] py-7 sm:space-y-6 sm:pt-[42px] sm:pb-12">
        <div className="space-y-2.5">
          <h1 className="text-[clamp(1.875rem,5.5vw,2.5rem)] leading-[1.12] font-bold tracking-[-0.04em]">
            {isAuthenticated || isValidating ? "Create a playlist" : "Connect to YouTube"}
          </h1>
          <p className="text-muted">
            Build a YouTube playlist from recent subscription uploads or video links.
          </p>
        </div>

        {isValidating ? (
          <p className="panel p-4 text-sm text-muted sm:p-6" role="status">
            Checking authentication…
          </p>
        ) : (
          <>
            {isAuthenticated ? (
              <section className="panel" aria-label="Playlist settings">
                <fieldset className="source-options grid min-w-0 grid-cols-2 gap-3 border-b border-line px-4 sm:flex sm:gap-6 sm:px-6">
                  <legend className="sr-only">Playlist source</legend>
                  <input
                    className="sr-only"
                    id="subscriptions"
                    name="source"
                    type="radio"
                    checked={!showLinkInput}
                    onChange={() => setShowLinkInput(false)}
                  />
                  <label className="source-option" htmlFor="subscriptions">Subscriptions</label>
                  <input
                    className="sr-only"
                    id="videoLinksSource"
                    name="source"
                    type="radio"
                    checked={showLinkInput}
                    onChange={() => setShowLinkInput(true)}
                  />
                  <label className="source-option" htmlFor="videoLinksSource">Video links</label>
                </fieldset>

                <div className="grid gap-5 p-4 sm:p-6">
                  {showLinkInput && (
                    <div className="grid gap-1.5 text-sm">
                      <label className="font-semibold" htmlFor="videoLinks">YouTube video links</label>
                      <textarea
                        id="videoLinks"
                        className="form-control resize-y"
                        rows={4}
                        value={videoLinks}
                        onChange={(e) => setVideoLinks(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=…"
                        aria-describedby="videoLinksHint"
                      />
                      <p id="videoLinksHint" className="text-muted">Paste one video link per line.</p>
                    </div>
                  )}

                  <div className="grid max-w-[460px] grid-cols-2 gap-4 text-sm font-semibold">
                    {!showLinkInput && (
                      <label className="grid gap-1.5">
                        Videos to fetch
                        <input
                          id="videoLimit"
                          className="form-control"
                          type="number"
                          min="1"
                          max="200"
                          value={videoLimit}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              setVideoLimit("");
                            } else {
                              const num = parseInt(val);
                              if (!isNaN(num) && num > 0) setVideoLimit(num);
                            }
                          }}
                        />
                      </label>
                    )}

                    <label className="grid gap-1.5">
                      Videos per playlist
                      <input
                        id="playlistSize"
                        className="form-control"
                        type="number"
                        min="1"
                        max="200"
                        value={playlistSize}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setPlaylistSize("");
                          } else {
                            const num = parseInt(val);
                            if (!isNaN(num) && num > 0) setPlaylistSize(num);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-2 text-center sm:flex-row sm:items-center sm:gap-3.5">
                    <Button
                      onClick={showLinkInput ? handleCreatePlaylistFromLinks : handleCreatePlaylist}
                      loading={isLoading}
                    >
                      {isLoading ? "Creating playlist…" : "Create playlist"}
                    </Button>
                    <p className="text-sm text-muted">New playlists are private.</p>
                  </div>
                </div>
              </section>
            ) : (
              <form
                className="panel space-y-4 p-4 sm:p-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (acceptedPolicies) void authenticate();
                }}
              >
                <div className="flex items-start gap-2.5 text-sm">
                  <input
                    id="accept-policies"
                    type="checkbox"
                    className="mt-0.5 size-4 shrink-0 accent-primary"
                    required
                    checked={acceptedPolicies}
                    onChange={(event) => setAcceptedPolicies(event.target.checked)}
                  />
                  <label htmlFor="accept-policies">
                    I agree to the <Link className="underline underline-offset-4" href="/privacy">Privacy Policy</Link>{" "}
                    and <Link className="underline underline-offset-4" href="/terms">Terms of Service</Link>.
                  </label>
                </div>
                <Button type="submit" className="w-full sm:w-auto" disabled={!acceptedPolicies} loading={authBusy}>
                  Continue to Google
                </Button>
              </form>
            )}

            {(authError || error) && (
              <p role="alert" className="rounded-xl bg-danger-tint px-4 py-3 text-sm text-danger wrap-anywhere">
                {authError || error}
              </p>
            )}
            {message && (
              <p role="status" className="rounded-xl bg-success-tint px-4 py-3 text-sm text-success">
                {message}
              </p>
            )}

            {isAuthenticated && isLoading && (
              <div className="panel space-y-4 p-4 sm:p-6">
                <ProgressBar value={progress} status={progressStatus} />
                <Button variant="danger" onClick={cancel}>Cancel</Button>
              </div>
            )}

            {isAuthenticated && playlists.length > 0 && (
              <section className="panel" aria-labelledby="ready-playlists">
                <h2 id="ready-playlists" className="px-4 pt-4 pb-3 text-lg font-bold sm:px-6">
                  Your playlist{playlists.length > 1 ? "s are" : " is"} ready
                </h2>
                <ul className="divide-y divide-line border-t border-line" role="list">
                  {playlists.map((playlist, index) => (
                    <li key={playlist.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
                      <span className="font-semibold">
                        {playlists.length > 1 ? `Part ${index + 1}` : "Playlist"}{" "}
                        <span className="text-sm font-normal text-muted">({playlist.count} videos)</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => window.open(playlist.url, "_blank", "noopener,noreferrer")}
                          disabled={deletingPlaylistIds.has(playlist.id)}
                        >
                          Open on YouTube
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={async () => await handleDeletePlaylist(playlist.id)}
                          loading={deletingPlaylistIds.has(playlist.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {isAuthenticated && failedVideos.length > 0 && (
              <section className="panel space-y-2 p-4 sm:p-6" aria-labelledby="failed-videos">
                <h2 id="failed-videos" className="text-lg font-bold text-danger">Failed videos</h2>
                <ul className="divide-y divide-line" role="list">
                  {failedVideos.map((title, index) => (
                    <li key={index} className="flex items-center gap-2 py-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(title, index)}
                        className="size-11 shrink-0 p-0"
                        aria-label={`Copy title: ${title}`}
                        title="Copy title"
                      >
                        {copiedVideos.has(index) ? (
                          <CheckIcon className="size-4 text-success" />
                        ) : (
                          <CopyIcon className="size-4 text-muted" />
                        )}
                      </Button>
                      <span className="min-w-0 text-sm wrap-anywhere">{title}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {isAuthenticated && <GeneratedPlaylists accessToken={accessToken} />}
          </>
        )}
      </main>
    </>
  );
}
