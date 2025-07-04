"use client";

import { useState } from "react";
import { useYouTubeAuth, useYouTubeApi } from "@/hooks";

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [playlistId, setPlaylistId] = useState("");

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
    cancel,
  } = useYouTubeApi(accessToken);

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
        <h1 className="text-3xl font-bold">YouTube Playlist Pulse</h1>
        <div className="text-center">
          <p className="text-gray-200">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">YouTube Playlist Pulse</h1>

      <div>{error}</div>

      <div>{message}</div>

      {playlistId && (
        <a
          target="_blank"
          href={`https://www.youtube.com/playlist?list=${playlistId}`}
        >
          <button>Open playlist</button>
        </a>
      )}

      {failedVideos.length > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-semibold">Failed Videos:</strong>
          <ul className="list-disc pl-5">
            {failedVideos.map((videoId: string, index: number) => (
              <li key={index}>{videoId}</li>
            ))}
          </ul>
        </div>
      )}

      {!isAuthenticated ? (
        <button onClick={() => authenticate(true)}>Sign in with YouTube</button>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <button onClick={handleCreatePlaylist} disabled={isLoading}>
              {isLoading ? "Creating Playlist..." : "Create New Playlist"}
            </button>
            <button onClick={logout}>Logout</button>
          </div>

          {isLoading && (
            <div className="space-y-2">
              <p className="text-sm text-center text-gray-100">
                {progressStatus} ({progress}%)
              </p>
              <div className="flex justify-center">
                <button
                  onClick={cancel}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isAuthenticated && (
        <button onClick={forceReAuthenticate}>Switch Google Account</button>
      )}
    </div>
  );
}
