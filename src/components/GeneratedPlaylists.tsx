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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
          setSelectedIds(new Set());
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allSelected =
    playlists.length > 0 && selectedIds.size === playlists.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(playlists.map((p) => p.id)));
    }
  };

  const handleDeleteSelected = async () => {
    const idsToDelete =
      selectedIds.size > 0
        ? Array.from(selectedIds)
        : playlists.map((p) => p.id);

    const confirmMessage =
      selectedIds.size > 0
        ? `Delete ${idsToDelete.length} selected playlist(s)?`
        : `Delete ALL ${idsToDelete.length} generated playlist(s)?`;

    if (!window.confirm(confirmMessage)) return;

    setIsDeleting(true);
    setError(null);

    try {
      for (const id of idsToDelete) {
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
      <div className="bg-[--color-youtube-surface] border border-[--color-youtube-secondary] rounded-lg p-4">
        <p className="text-[--color-foreground] opacity-75 text-center">
          Loading generated playlists...
        </p>
      </div>
    );
  }

  if (playlists.length === 0) {
    return null;
  }

  return (
    <div className="bg-[--color-youtube-surface] border border-[--color-youtube-secondary] rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[--color-foreground]">
          Generated Playlists ({playlists.length})
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={isDeleting}
          >
            Refresh
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteSelected}
            loading={isDeleting}
          >
            {selectedIds.size > 0
              ? `Delete Selected (${selectedIds.size})`
              : "Delete All"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2 px-1">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleSelectAll}
          className="accent-[--color-youtube-primary]"
        />
        <span className="text-sm text-[--color-foreground] opacity-75">
          Select All
        </span>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-2">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="flex items-center gap-3 bg-[--color-background] p-3 rounded border border-[--color-youtube-secondary]"
          >
            <input
              type="checkbox"
              checked={selectedIds.has(playlist.id)}
              onChange={() => toggleSelect(playlist.id)}
              className="accent-[--color-youtube-primary] flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[--color-foreground] font-medium truncate">
                {playlist.title}
              </p>
              <p className="text-sm text-[--color-foreground] opacity-60">
                {playlist.videoCount} video{playlist.videoCount !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteSingle(playlist.id)}
              disabled={isDeleting}
              className="flex-shrink-0 p-1.5"
              title="Delete playlist"
            >
              <TrashIcon className="w-4 h-4 text-[--color-error]" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
