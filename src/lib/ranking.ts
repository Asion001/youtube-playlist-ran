import { Video } from "./types";

export function extractPlaylistId(url: string): string | null {
  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return null;
  }

  const normalizedUrl = /^(https?:)?\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;

  try {
    const parsedUrl = new URL(normalizedUrl);
    const listParam = parsedUrl.searchParams.get("list");

    if (listParam && /^[a-zA-Z0-9_-]{10,128}$/.test(listParam)) {
      return listParam;
    }
  } catch {
    // Fallback to regex parsing below for non-standard input
  }

  const patterns = [
    /[?&]list=([a-zA-Z0-9_-]{10,128})/i,
    /\blist=([a-zA-Z0-9_-]{10,128})/i,
  ];

  for (const pattern of patterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function extractInitialData(html: string): any | null {
  const jsonPattern = /var ytInitialData = ({.+?});/s;
  const jsonMatch = html.match(jsonPattern);

  if (!jsonMatch || !jsonMatch[1]) {
    return null;
  }

  try {
    return JSON.parse(jsonMatch[1]);
  } catch (parseError) {
    console.error("JSON parse error:", parseError);
    return null;
  }
}

function extractInnertubeApiKey(html: string): string | null {
  const keyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  return keyMatch?.[1] ?? null;
}

function extractClientVersion(html: string): string {
  const versionMatch = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/);
  return versionMatch?.[1] ?? "2.20240224.00.00";
}

function getPlaylistItemsFromBrowseData(data: any): any[] {
  const initialItems =
    data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer
      ?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer
      ?.contents?.[0]?.playlistVideoListRenderer?.contents;
  if (Array.isArray(initialItems)) {
    return initialItems;
  }

  const actionItems = data?.onResponseReceivedActions?.flatMap(
    (action: any) =>
      action?.appendContinuationItemsAction?.continuationItems ?? [],
  );

  if (Array.isArray(actionItems) && actionItems.length > 0) {
    return actionItems;
  }

  const endpointItems = data?.onResponseReceivedEndpoints?.flatMap(
    (endpoint: any) =>
      endpoint?.appendContinuationItemsAction?.continuationItems ?? [],
  );

  if (Array.isArray(endpointItems) && endpointItems.length > 0) {
    return endpointItems;
  }

  const continuationItems =
    data?.continuationContents?.playlistVideoListContinuation?.contents;

  if (Array.isArray(continuationItems)) {
    return continuationItems;
  }

  return [];
}

function getContinuationTokenFromItems(items: any[]): string | null {
  for (let index = items.length - 1; index >= 0; index--) {
    const item = items[index];
    const token =
      item?.continuationItemRenderer?.continuationEndpoint?.continuationCommand
        ?.token ||
      item?.continuationItemRenderer?.continuationEndpoint?.continuationCommand
        ?.continuation ||
      item?.continuationItemRenderer?.continuationEndpoint?.nextContinuationData
        ?.continuation;

    if (typeof token === "string" && token.length > 0) {
      return token;
    }
  }

  return null;
}

function getContinuationTokenFromData(data: any, items: any[]): string | null {
  const tokenFromItems = getContinuationTokenFromItems(items);
  if (tokenFromItems) {
    return tokenFromItems;
  }

  const tokenFromContinuationContents =
    data?.continuationContents?.playlistVideoListContinuation
      ?.continuations?.[0]?.nextContinuationData?.continuation ||
    data?.continuationContents?.playlistVideoListContinuation
      ?.continuations?.[0]?.reloadContinuationData?.continuation;

  if (
    typeof tokenFromContinuationContents === "string" &&
    tokenFromContinuationContents.length > 0
  ) {
    return tokenFromContinuationContents;
  }

  return null;
}

function addVideosFromItems(items: any[], videoMap: Map<string, Video>) {
  items.forEach((item: any) => {
    const videoRenderer = item?.playlistVideoRenderer;

    if (!videoRenderer?.videoId) {
      return;
    }

    const videoId = videoRenderer.videoId;
    const title =
      videoRenderer.title?.runs?.[0]?.text ||
      videoRenderer.title?.simpleText ||
      "Untitled Video";

    if (!videoMap.has(videoId)) {
      videoMap.set(videoId, {
        id: videoId,
        title,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        score: 1000,
      });
    }
  });
}

export async function fetchPlaylistVideos(
  playlistId: string,
): Promise<Video[]> {
  // Default Cloudflare Pages Function route; override with VITE_PROXY_URL when needed.
  const proxyBaseUrl = import.meta.env.VITE_PROXY_URL || "/api/proxy";
  const proxyUrl = `${proxyBaseUrl}?playlistId=${encodeURIComponent(playlistId)}`;

  try {
    const response = await fetch(proxyUrl, {
      method: "GET",
      headers: {
        Accept: "text/html",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist`);
    }

    const html = await response.text();
    const videoMap = new Map<string, Video>();

    const initialData = extractInitialData(html);
    const apiKey = extractInnertubeApiKey(html);
    const clientVersion = extractClientVersion(html);

    if (initialData) {
      const initialItems = getPlaylistItemsFromBrowseData(initialData);
      addVideosFromItems(initialItems, videoMap);

      let continuationToken = getContinuationTokenFromData(
        initialData,
        initialItems,
      );
      const maxContinuationRequests = 40;
      let continuationRequests = 0;

      while (
        continuationToken &&
        apiKey &&
        continuationRequests < maxContinuationRequests
      ) {
        continuationRequests++;

        try {
          const continuationUrl = `${proxyBaseUrl}?continuation=${encodeURIComponent(continuationToken)}&apiKey=${encodeURIComponent(apiKey)}&clientVersion=${encodeURIComponent(clientVersion)}`;
          const continuationResponse = await fetch(continuationUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          });

          if (!continuationResponse.ok) {
            break;
          }

          const continuationData = await continuationResponse.json();
          const continuationItems =
            getPlaylistItemsFromBrowseData(continuationData);

          if (
            !Array.isArray(continuationItems) ||
            continuationItems.length === 0
          ) {
            break;
          }

          addVideosFromItems(continuationItems, videoMap);

          const nextToken = getContinuationTokenFromData(
            continuationData,
            continuationItems,
          );

          if (!nextToken || nextToken === continuationToken) {
            break;
          }

          continuationToken = nextToken;
        } catch {
          break;
        }
      }
    }

    if (videoMap.size === 0) {
      const patterns = [
        /"videoId":"([a-zA-Z0-9_-]{11})"[^}]*?"title":\{"runs":\[\{"text":"([^"]+)"/g,
        /"videoId":"([a-zA-Z0-9_-]{11})"[^}]*?"title":\{"simpleText":"([^"]+)"/g,
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const videoId = match[1];
          const title = match[2];

          if (!videoMap.has(videoId) && videoId && title) {
            videoMap.set(videoId, {
              id: videoId,
              title: title,
              thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
              score: 1000,
            });
          }
        }
      }
    }

    const uniqueVideos = Array.from(videoMap.values());

    if (uniqueVideos.length === 0) {
      throw new Error(
        "No videos found in playlist. The playlist might be private or empty.",
      );
    }

    return uniqueVideos;
  } catch (error: any) {
    console.error("Fetch error:", error);
    throw new Error(
      "Failed to load playlist. Please ensure the playlist is public and try again.",
    );
  }
}

const comparisonHistory = new Set<string>();

function getPairKey(idA: string, idB: string): string {
  return [idA, idB].sort().join("-");
}

export function calculateNextPair(videos: Video[]): [Video, Video] | null {
  if (videos.length < 2) return null;

  const sortedVideos = [...videos].sort((a, b) => b.score - a.score);

  const maxAttempts = videos.length * videos.length;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    let indexA: number;
    let indexB: number;

    const useAdjacentComparison = Math.random() < 0.5;

    if (useAdjacentComparison) {
      indexA = Math.floor(Math.random() * (sortedVideos.length - 1));
      indexB = indexA + 1;
    } else {
      indexA = Math.floor(Math.random() * sortedVideos.length);
      indexB = Math.floor(Math.random() * sortedVideos.length);

      while (indexB === indexA) {
        indexB = Math.floor(Math.random() * sortedVideos.length);
      }
    }

    const videoA = sortedVideos[indexA];
    const videoB = sortedVideos[indexB];
    const pairKey = getPairKey(videoA.id, videoB.id);

    if (!comparisonHistory.has(pairKey)) {
      comparisonHistory.add(pairKey);
      return [videoA, videoB];
    }
  }

  const randomA = Math.floor(Math.random() * sortedVideos.length);
  let randomB = Math.floor(Math.random() * sortedVideos.length);
  while (randomB === randomA) {
    randomB = Math.floor(Math.random() * sortedVideos.length);
  }

  return [sortedVideos[randomA], sortedVideos[randomB]];
}

export function resetComparisonHistory(): void {
  comparisonHistory.clear();
}

export function updateScores(
  videos: Video[],
  winnerId: string,
  loserId: string,
): Video[] {
  const K = 32;

  return videos.map((video) => {
    if (video.id !== winnerId && video.id !== loserId) {
      return video;
    }

    const winner = videos.find((v) => v.id === winnerId)!;
    const loser = videos.find((v) => v.id === loserId)!;

    const expectedWinner =
      1 / (1 + Math.pow(10, (loser.score - winner.score) / 400));
    const expectedLoser =
      1 / (1 + Math.pow(10, (winner.score - loser.score) / 400));

    if (video.id === winnerId) {
      return { ...video, score: video.score + K * (1 - expectedWinner) };
    } else {
      return { ...video, score: video.score + K * (0 - expectedLoser) };
    }
  });
}

export function calculateMinimumComparisons(videoCount: number): number {
  return Math.ceil(videoCount * 1.5);
}

export function getRankedVideos(videos: Video[]): Video[] {
  return [...videos].sort((a, b) => b.score - a.score);
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
