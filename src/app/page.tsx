"use client";

import { useState, useEffect } from "react";
import { useYouTubeAuth, useYouTubeApi } from "@/hooks";
import { CheckIcon, CopyIcon } from "@/app/icons";
import { Button, ProgressBar } from "@/components/ui";

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [playlistId, setPlaylistId] = useState("");
  const [copiedVideos, setCopiedVideos] = useState<Set<number>>(new Set());

  const {
    isAuthenticated,
    accessToken,
    authenticate,
    logout,
    isValidating,
    forceReAuthenticate,
  } = useYouTubeAuth();
  const {
    isLoading,
    progress,
    progressStatus,
    failedVideos,
    generatePlaylist,
    generatePlaylistFromLinks,
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
      const result = await generatePlaylistFromLinks(links);
      setMessage(
        `Playlist created successfully! Added ${
          result.videoCount - failedVideos.length
        } videos. `
      );
      setPlaylistId(result.playlistId);
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

  // Update document title with progress during playlist creation
  useEffect(() => {
    const baseTitle = "YouTube Playlist Pulse";

    if (isLoading && progress > 0) {
      document.title = `${progress}% - ${baseTitle}`;
    } else {
      document.title = baseTitle;
    }

    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = baseTitle;
    };
  }, [isLoading, progress]);

  const handleCreatePlaylist = async () => {
    try {
      setError(null);
      setMessage(null);
      const result = await generatePlaylist();
      setMessage(
        `Playlist created successfully! Added ${
          result.videoCount - failedVideos.length
        } videos. `
      );
      setPlaylistId(result.playlistId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create playlist";
      if (errorMessage !== "Operation cancelled") {
        setError(errorMessage);
      }
    }
  };

  if (isValidating) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-[--color-foreground]">
          YouTube Playlist Pulse
        </h1>
        <div className="text-center">
          <p className="text-[--color-foreground] opacity-75">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-[--color-foreground] mb-8">
        YouTube Playlist Pulse
      </h1>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Playlist Link */}
      {playlistId && (
        <div className="bg-[--color-youtube-surface] border border-[--color-youtube-secondary] rounded-lg p-4">
          <p className="text-[--color-foreground] mb-3 font-medium">
            Your playlist is ready!
          </p>
          <Button
            variant="primary"
            onClick={() =>
              window.open(
                `https://www.youtube.com/playlist?list=${playlistId}`,
                "_blank"
              )
            }
          >
            Open Playlist on YouTube
          </Button>
        </div>
      )}

      {/* Failed Videos */}
      {failedVideos.length > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong className="font-semibold">Failed Videos:</strong>
          <ul className="list-none mt-2 space-y-1">
            {failedVideos.map((title: string, index: number) => (
              <li key={index} className="flex items-center gap-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(title, index)}
                  className="flex-shrink-0 p-1"
                  title="Copy title"
                >
                  {copiedVideos.has(index) ? (
                    <CheckIcon className="w-4 h-4 text-green-600" />
                  ) : (
                    <CopyIcon className="w-4 h-4 text-gray-600" />
                  )}
                </Button>
                <span className="text-sm">{title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Authentication Section */}
      {!isAuthenticated ? (
        <div className="text-center space-y-4">
          <p className="text-[--color-foreground] opacity-75">
            Connect your YouTube account to create playlists from your
            subscriptions
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => authenticate(true)}
          >
            Sign in with YouTube
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreatePlaylist}
              disabled={isLoading}
              loading={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? "Creating Playlist..." : "Create from Subscriptions"}
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowLinkInput(!showLinkInput)}
              className="w-full sm:w-auto"
            >
              {showLinkInput ? "Hide Link Input" : "Create from Links"}
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={forceReAuthenticate}>
                Switch Account
              </Button>
              <Button variant="secondary" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>

          {/* Create from links section */}
          {showLinkInput && (
            <div className="space-y-4 bg-[--color-youtube-surface] p-4 rounded-lg border border-[--color-youtube-secondary]">
              <h2 className="text-xl font-semibold">Create Playlist from Links</h2>
              <p className="text-sm text-[--color-foreground] opacity-75">
                Paste YouTube video links below, one per line.
              </p>
              <textarea
                className="w-full p-2 bg-[--color-background] border border-[--color-youtube-secondary] rounded-md"
                rows={5}
                value={videoLinks}
                onChange={(e) => setVideoLinks(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=...\nhttps://youtu.be/..."
              />
              <Button
                variant="primary"
                size="lg"
                onClick={handleCreatePlaylistFromLinks}
                disabled={isLoading}
                loading={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? "Creating Playlist..." : "Create Playlist"}
              </Button>
            </div>
          )}

          {/* Progress Section */}
          {isLoading && (
            <div className="space-y-4 bg-[--color-youtube-surface] p-4 rounded-lg border border-[--color-youtube-secondary]">
              <ProgressBar
                value={progress}
                status={progressStatus}
                variant="default"
                size="md"
              />
              <div className="flex justify-center">
                <Button variant="danger" onClick={cancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
