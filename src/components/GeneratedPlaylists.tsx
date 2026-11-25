"use client";

import { useState, useEffect, useRef } from "react";
import { useYouTubeApi } from "@/hooks";
import { TrashIcon } from "@/app/icons";
import { Button } from "@/components/ui";

interface GeneratedPlaylist {
  id: string;
  title: string;
  videoCount: number;
}

interface GeneratedPlaylistsProps {
  accessToken: string | null;
}

export function GeneratedPlaylists({ accessToken }: GeneratedPlaylistsProps) {
  const [playlists, setPlaylists] = useState<GeneratedPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { fetchGeneratedPlaylists, deletePlaylist } =
    useYouTubeApi(accessToken);

  const apiRef = useRef({ fetchGeneratedPlaylists, deletePlaylist });
  apiRef.current = { fetchGeneratedPlaylists, deletePlaylist };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiRef.current.fetchGeneratedPlaylists();
        if (!cancelled) {
          setPlaylists(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load playlists"
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [accessToken, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleDeleteAll = async () => {
    const confirmMessage = `Delete ALL ${playlists.length} generated playlist(s)?`;
    if (!window.confirm(confirmMessage)) return;

    setIsDeleting(true);
    setError(null);

    try {
      for (const { id } of playlists) {
        await apiRef.current.deletePlaylist(id);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
      refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete playlists"
      );
      refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    setIsDeleting(true);
    setError(null);
    try {
      await apiRef.current.deletePlaylist(id);
      refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete playlist"
      );
      refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <p className="panel p-4 text-sm text-muted sm:p-6" role="status">
        Loading generated playlists…
      </p>
    );
  }

  if (playlists.length === 0) {
    return null;
  }

  return (
    <section className="panel" aria-labelledby="generated-playlists">
      <div className="flex flex-col items-start gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <h2 id="generated-playlists" className="text-lg leading-tight font-bold tracking-tight">
          Generated playlists <span className="font-medium text-muted">({playlists.length})</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={refresh}
            disabled={isDeleting}
          >
            Refresh
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteAll}
            loading={isDeleting}
          >
            Delete all
          </Button>
        </div>
      </div>

      {error && (
        <p role="alert" className="bg-danger-tint px-4 py-3 text-sm text-danger wrap-anywhere sm:px-6">
          {error}
        </p>
      )}

      <ul className="max-h-80 divide-y divide-line overflow-y-auto" role="list">
        {playlists.map((playlist) => (
          <li
            key={playlist.id}
            className="flex items-center gap-3 px-4 py-3 sm:px-6"
          >
            <div className="min-w-0 flex-1 space-y-0.5">
              <a
                href={`https://www.youtube.com/playlist?list=${encodeURIComponent(playlist.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm text-[15px] font-semibold wrap-anywhere underline underline-offset-3 hover:text-danger"
              >
                {playlist.title}{" "}
                <span aria-hidden="true" className="text-xs text-muted">↗</span>
              </a>
              <p className="text-sm text-muted">
                {playlist.videoCount} video{playlist.videoCount !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => await handleDeleteSingle(playlist.id)}
              disabled={isDeleting}
              className="size-11 shrink-0 p-0 text-muted hover:bg-danger-tint hover:text-danger"
              aria-label={`Delete playlist: ${playlist.title}`}
              title="Delete playlist"
            >
              <TrashIcon className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
