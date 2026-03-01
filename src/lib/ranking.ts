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
  const proxyBaseUrl = import.meta.env.VITE_PROXY_URL || '/api/proxy'
  const proxyUrl = `${proxyBaseUrl}?playlistId=${encodeURIComponent(playlistId)}`
  
  try {
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch playlist`)
    }
    
    const html = await response.text()
    const videoMap = new Map<string, Video>()
    
    const jsonPattern = /var ytInitialData = ({.+?});/s
    const jsonMatch = html.match(jsonPattern)
    
    if (jsonMatch && jsonMatch[1]) {
      try {
        const data = JSON.parse(jsonMatch[1])
        
        const contents = data?.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents
        
        if (contents && Array.isArray(contents)) {
          contents.forEach((item: any) => {
            const videoRenderer = item?.playlistVideoRenderer
            if (videoRenderer && videoRenderer.videoId) {
              const videoId = videoRenderer.videoId
              const title = videoRenderer.title?.runs?.[0]?.text || videoRenderer.title?.simpleText || 'Untitled Video'
              
              if (!videoMap.has(videoId)) {
                videoMap.set(videoId, {
                  id: videoId,
                  title: title,
                  thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                  score: 1000
                })
              }
            }
          })
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
      }
    }
    
    if (videoMap.size === 0) {
      const patterns = [
        /"videoId":"([a-zA-Z0-9_-]{11})"[^}]*?"title":\{"runs":\[\{"text":"([^"]+)"/g,
        /"videoId":"([a-zA-Z0-9_-]{11})"[^}]*?"title":\{"simpleText":"([^"]+)"/g,
      ]
      
      for (const pattern of patterns) {
        let match
        while ((match = pattern.exec(html)) !== null) {
          const videoId = match[1]
          const title = match[2]
          
          if (!videoMap.has(videoId) && videoId && title) {
            videoMap.set(videoId, {
              id: videoId,
              title: title,
              thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
              score: 1000
            })
          }
        }
      }
    }
    
    const uniqueVideos = Array.from(videoMap.values())
    
    if (uniqueVideos.length === 0) {
      throw new Error('No videos found in playlist. The playlist might be private or empty.')
    }
    
    return uniqueVideos
  } catch (error: any) {
    console.error('Fetch error:', error)
    throw new Error('Failed to load playlist. Please ensure the playlist is public and try again.')
  }
}

const comparisonHistory = new Set<string>()

function getPairKey(idA: string, idB: string): string {
  return [idA, idB].sort().join('-')
}

export function calculateNextPair(videos: Video[]): [Video, Video] | null {
  if (videos.length < 2) return null

  const sortedVideos = [...videos].sort((a, b) => b.score - a.score)
  
  const maxAttempts = videos.length * videos.length
  let attempts = 0
  
  while (attempts < maxAttempts) {
    attempts++
    
    let indexA: number
    let indexB: number
    
    const useAdjacentComparison = Math.random() < 0.5
    
    if (useAdjacentComparison) {
      indexA = Math.floor(Math.random() * (sortedVideos.length - 1))
      indexB = indexA + 1
    } else {
      indexA = Math.floor(Math.random() * sortedVideos.length)
      indexB = Math.floor(Math.random() * sortedVideos.length)
      
      while (indexB === indexA) {
        indexB = Math.floor(Math.random() * sortedVideos.length)
      }
    }
    
    const videoA = sortedVideos[indexA]
    const videoB = sortedVideos[indexB]
    const pairKey = getPairKey(videoA.id, videoB.id)
    
    if (!comparisonHistory.has(pairKey)) {
      comparisonHistory.add(pairKey)
      return [videoA, videoB]
    }
  }
  
  const randomA = Math.floor(Math.random() * sortedVideos.length)
  let randomB = Math.floor(Math.random() * sortedVideos.length)
  while (randomB === randomA) {
    randomB = Math.floor(Math.random() * sortedVideos.length)
  }
  
  return [sortedVideos[randomA], sortedVideos[randomB]]
}

export function resetComparisonHistory(): void {
  comparisonHistory.clear()
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
  return Math.ceil(videoCount * 1.5)
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
