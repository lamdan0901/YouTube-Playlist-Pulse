import { useState, useRef } from "react";

interface Video {
  videoId: string;
  publishedAt: string;
  title: string;
  channelTitle: string;
  duration: number;
}

export const useYouTubeApi = (accessToken: string | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [failedVideos, setFailedVideos] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    if (!accessToken) throw new Error("Not authenticated");

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          ...options.headers,
        },
        signal: abortControllerRef.current?.signal,
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return data;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Operation cancelled");
      }
      throw error;
    }
  };

  const updateProgress = (status: string, current: number, total: number) => {
    const percentage = Math.round((current / total) * 100);
    setProgress(percentage);
    setProgressStatus(status);
  };

  const parseISO8601Duration = (duration: string): number => {
    const matches = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
    if (!matches) return 0;

    const hours = parseInt(matches[1] || "0");
    const minutes = parseInt(matches[2] || "0");
    const seconds = parseInt(matches[3] || "0");

    return hours * 3600 + minutes * 60 + seconds;
  };

  const getUploadsPlaylistId = async (channelId: string): Promise<string> => {
    const data = await fetchWithAuth(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}`
    );

    if (!data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads) {
      throw new Error(`No uploads playlist found for channel ${channelId}`);
    }

    return data.items[0].contentDetails.relatedPlaylists.uploads;
  };

  const fetchVideosFromPlaylist = async (
    playlistId: string,
    maxResults: number = 5
  ): Promise<string[]> => {
    let videoIds: string[] = [];
    let nextPageToken = "";

    do {
      // Check if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error("Operation cancelled");
      }

      const data = await fetchWithAuth(
        `https://www.googleapis.com/youtube/v3/playlistItems?` +
          `part=contentDetails&playlistId=${playlistId}&maxResults=50` +
          (nextPageToken ? `&pageToken=${nextPageToken}` : "")
      );

      const newIds = data.items.map((item: any) => item.contentDetails.videoId);
      videoIds = [...videoIds, ...newIds];

      if (videoIds.length >= maxResults) {
        videoIds = videoIds.slice(0, maxResults);
        break;
      }

      nextPageToken = data.nextPageToken;
    } while (nextPageToken);

    return videoIds;
  };

  const filterVideosByDuration = async (
    videoIds: string[]
  ): Promise<Video[]> => {
    const videos: Video[] = [];
    const batchSize = 50;

    for (let i = 0; i < videoIds.length; i += batchSize) {
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error("Operation cancelled");
      }

      const batchIds = videoIds.slice(i, i + batchSize);
      const data = await fetchWithAuth(
        `https://www.googleapis.com/youtube/v3/videos?` +
          `part=contentDetails,snippet&id=${batchIds.join(",")}`
      );

      for (const item of data.items) {
        const duration = parseISO8601Duration(item.contentDetails.duration);

        // Filter videos between 1 minute and 20 minutes
        if (duration > 60 && duration <= 1200) {
          videos.push({
            videoId: item.id,
            publishedAt: item.snippet.publishedAt,
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            duration,
          });
        }
      }
    }

    return videos;
  };

  const addVideosToPlaylist = async (
    playlistId: string,
    videos: Video[]
  ): Promise<void> => {
    const headers = new Headers({
      Authorization: "Bearer " + accessToken,
      Accept: "application/json",
      "Content-Type": "application/json",
    });

    for (const video of videos) {
      // Check if cancelled
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error("Operation cancelled");
      }

      const videoId = video.videoId;
      try {
        const response = await fetch(
          "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet",
          {
            method: "POST",
            headers,
            signal: abortControllerRef.current?.signal,
            body: JSON.stringify({
              snippet: {
                playlistId: playlistId,
                resourceId: {
                  kind: "youtube#video",
                  videoId: videoId,
                },
              },
            }),
          }
        );

        const data = await response.json();

        if (data.error) {
          console.error(
            `Failed to add video ${video.title}:`,
            data.error.message
          );
          setFailedVideos((prevFailedVideos: string[]) => [
            ...prevFailedVideos,
            video.title,
          ]);
        } else {
          console.log(`Added video ${video.title} to playlist`);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Operation cancelled");
        }
        setFailedVideos((prevFailedVideos: string[]) => [
          ...prevFailedVideos,
          video.title,
        ]);
        console.error(`Error adding video ${video.title} to playlist:`, error);
      }
    }
  };

  async function createPlaylist(title: string) {
    const headers = new Headers({
      Authorization: "Bearer " + accessToken,
      Accept: "application/json",
      "Content-Type": "application/json",
    });

    try {
      const response = await fetch(
        "https://www.googleapis.com/youtube/v3/playlists?part=snippet,status",
        {
          method: "POST",
          headers,
          signal: abortControllerRef.current?.signal,
          body: JSON.stringify({
            snippet: {
              title: title,
              description: "Generated playlist from subscriptions.",
            },
            status: {
              privacyStatus: "private",
            },
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      console.log(`Playlist created with ID: ${data.id}`);
      return data.id;
    } catch (error) {
      console.error("Error creating playlist:", error);
      throw error;
    }
  }

  async function fetchSubscribedChannels() {
    const headers = new Headers({
      Authorization: "Bearer " + accessToken,
      Accept: "application/json",
    });

    let channels: any[] = [];
    let nextPageToken = "";

    try {
      console.log("Fetching subscribed channels...");
      do {
        // Check if cancelled
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Operation cancelled");
        }

        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/subscriptions` +
            `?part=snippet` +
            `&mine=true` +
            `&maxResults=50` +
            (nextPageToken ? `&pageToken=${nextPageToken}` : ""),
          {
            headers,
            signal: abortControllerRef.current?.signal,
          }
        );

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error.message);
        }

        if (data.items && data.items.length > 0) {
          channels = channels.concat(data.items);
        } else {
          break;
        }

        nextPageToken = data.nextPageToken || "";
      } while (nextPageToken);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Operation cancelled");
      }
      console.error("Error fetching subscribed channels:", error);
      throw error;
    }

    console.log(`Done fetching channels`);
    return channels.map((item) => item.snippet.resourceId.channelId);
  }

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort("Operation cancelled by user");
      setIsLoading(false);
      setProgress(0);
      setProgressStatus("");
    }
  };

  const generatePlaylist = async () => {
    if (!accessToken) {
      throw new Error("Authentication required");
    }

    // Create new AbortController for this operation
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setProgress(0);
    setFailedVideos([]);

    try {
      // 1. Fetch subscribed channels
      updateProgress("Fetching subscribed channels", 0, 100);
      const channels = await fetchSubscribedChannels();

      if (!channels.length) {
        throw new Error("No subscribed channels found");
      }

      // 2. Get uploads playlists and videos
      const allVideos: Video[] = [];
      for (let i = 0; i < channels.length; i++) {
        // Check if cancelled
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error("Operation cancelled");
        }

        updateProgress("Processing channels", i + 1, channels.length);

        try {
          const uploadsPlaylistId = await getUploadsPlaylistId(channels[i]);
          if (uploadsPlaylistId) {
            const videoIds = await fetchVideosFromPlaylist(uploadsPlaylistId);
            const filteredVideos = await filterVideosByDuration(videoIds);
            allVideos.push(...filteredVideos);
          }
          // Add delay between channels
          await new Promise((resolve) => setTimeout(resolve, 250));
        } catch (err) {
          if (err instanceof Error && err.message === "Operation cancelled") {
            throw err;
          }
          console.error(`Error processing channel ${channels[i]}:`, err);
          continue;
        }
      }

      if (!allVideos.length) {
        throw new Error("No suitable videos found");
      }

      // Sort and limit videos
      const sortedVideos = allVideos
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
        )
        .slice(0, 50);

      // Create playlist
      updateProgress("Creating playlist", 80, 100);
      const playlistId = await createPlaylist(new Date().toLocaleString());

      // Add videos to playlist with proper error handling
      updateProgress("Adding videos", 90, 100);
      await addVideosToPlaylist(playlistId, sortedVideos);

      updateProgress("Complete", 100, 100);
      return {
        playlistId,
        videoCount: sortedVideos.length,
      };
    } catch (error) {
      if (error instanceof Error && error.message === "Operation cancelled") {
        console.log("Playlist generation cancelled by user");
        setProgressStatus("Cancelled");
      }
      throw error;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const generatePlaylistFromLinks = async (videoLinks: string[]) => {
    if (!accessToken) {
      throw new Error("Authentication required");
    }

    // Create new AbortController for this operation
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setProgress(0);
    setFailedVideos([]);

    try {
      // 1. Extract and filter unique video IDs from links
      updateProgress("Extracting video IDs", 0, 100);
      const uniqueVideoIds = Array.from(
        new Set(
          videoLinks
            .map((link) => {
              const url = new URL(link);
              if (url.hostname === "youtu.be") {
                return url.pathname.slice(1);
              } else if (
                url.hostname === "www.youtube.com" ||
                url.hostname === "youtube.com"
              ) {
                return url.searchParams.get("v");
              }
              return null;
            })
            .filter((id): id is string => !!id)
        )
      );

      if (!uniqueVideoIds.length) {
        throw new Error("No valid video links found");
      }

      // 2. Fetch video details (to get titles for failed videos)
      updateProgress("Fetching video details", 25, 100);
      const videos = await filterVideosByDuration(uniqueVideoIds);

      // 3. Create playlist
      updateProgress("Creating playlist", 75, 100);
      const playlistId = await createPlaylist(
        `Custom Playlist ${new Date().toLocaleString()}`
      );

      // 4. Add videos to playlist
      updateProgress("Adding videos", 90, 100);
      await addVideosToPlaylist(playlistId, videos);

      updateProgress("Complete", 100, 100);
      return {
        playlistId,
        videoCount: videos.length,
      };
    } catch (error) {
      if (error instanceof Error && error.message === "Operation cancelled") {
        console.log("Playlist generation cancelled by user");
        setProgressStatus("Cancelled");
      }
      throw error;
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return {
    isLoading,
    progress,
    progressStatus,
    failedVideos,
    generatePlaylist,
    generatePlaylistFromLinks,
    cancel,
  };
};
