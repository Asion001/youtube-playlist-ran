import { Video } from './types'

export function extractPlaylistId(url: string): string | null {
  const patterns = [
    /[?&]list=([^&]+)/,
    /youtube\.com\/playlist\?list=([^&]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

export async function fetchPlaylistVideos(playlistId: string): Promise<Video[]> {
  const proxies = [
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ]
  
  const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`
  
  for (let i = 0; i < proxies.length; i++) {
    try {
      const proxyUrl = proxies[i](playlistUrl)
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch(proxyUrl, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        continue
      }
      
      const html = await response.text()
      
      if (!html || html.length < 100) {
        continue
      }
      
      const videos: Video[] = []
      const videoIdPattern = /"videoId":"([^"]+)"/g
      const titlePattern = /"title":{"runs":\[{"text":"([^"]+)"/g
      
      const videoIds: string[] = []
      const titles: string[] = []
      
      let match
      while ((match = videoIdPattern.exec(html)) !== null) {
        const videoId = match[1]
        if (videoId.length === 11 && !videoIds.includes(videoId)) {
          videoIds.push(videoId)
        }
      }
      
      while ((match = titlePattern.exec(html)) !== null) {
        titles.push(match[1])
      }
      
      const minLength = Math.min(videoIds.length, titles.length)
      
      if (minLength === 0) {
        continue
      }
      
      for (let i = 0; i < minLength; i++) {
        videos.push({
          id: videoIds[i],
          title: titles[i],
          thumbnail: `https://i.ytimg.com/vi/${videoIds[i]}/mqdefault.jpg`,
          score: 1000
        })
      }
      
      const uniqueVideos = videos.filter((video, index, self) => 
        index === self.findIndex((v) => v.id === video.id)
      )
      
      if (uniqueVideos.length > 0) {
        return uniqueVideos
      }
    } catch (error) {
      if (i === proxies.length - 1) {
        throw new Error('Failed to fetch playlist. All proxy attempts failed.')
      }
      continue
    }
  }
  
  throw new Error('Failed to fetch playlist videos')
}

export function calculateNextPair(videos: Video[]): [Video, Video] | null {
  if (videos.length < 2) return null

  const sortedVideos = [...videos].sort((a, b) => b.score - a.score)
  
  const middleIndex = Math.floor(sortedVideos.length / 2)
  const comparisonRange = Math.max(2, Math.floor(sortedVideos.length / 3))
  
  let videoA = sortedVideos[Math.floor(Math.random() * comparisonRange)]
  let videoB = sortedVideos[sortedVideos.length - 1 - Math.floor(Math.random() * comparisonRange)]
  
  if (videoA.id === videoB.id && sortedVideos.length > 1) {
    videoB = sortedVideos[sortedVideos.length - 1 - comparisonRange]
  }

  return [videoA, videoB]
}

export function updateScores(
  videos: Video[],
  winnerId: string,
  loserId: string
): Video[] {
  const K = 32

  return videos.map((video) => {
    if (video.id !== winnerId && video.id !== loserId) {
      return video
    }

    const winner = videos.find((v) => v.id === winnerId)!
    const loser = videos.find((v) => v.id === loserId)!

    const expectedWinner = 1 / (1 + Math.pow(10, (loser.score - winner.score) / 400))
    const expectedLoser = 1 / (1 + Math.pow(10, (winner.score - loser.score) / 400))

    if (video.id === winnerId) {
      return { ...video, score: video.score + K * (1 - expectedWinner) }
    } else {
      return { ...video, score: video.score + K * (0 - expectedLoser) }
    }
  })
}

export function calculateMinimumComparisons(videoCount: number): number {
  return Math.ceil(videoCount * Math.log2(videoCount))
}

export function getRankedVideos(videos: Video[]): Video[] {
  return [...videos].sort((a, b) => b.score - a.score)
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
