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
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://www.youtube.com/playlist?list=${playlistId}`)}`
  
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
