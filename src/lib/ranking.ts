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
  const apiKey = 'AIzaSyC8Y8v2LwJ0LdVkLvOCh-3GXR-p--0_6_Q'
  const maxResults = 50
  
  try {
    let allVideos: Video[] = []
    let nextPageToken = ''
    
    do {
      const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error('Failed to fetch playlist')
      }
      
      const data = await response.json()
      
      const videos: Video[] = data.items
        .filter((item: any) => item.snippet.title !== 'Private video' && item.snippet.title !== 'Deleted video')
        .map((item: any) => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.snippet.resourceId.videoId}/mqdefault.jpg`,
          score: 1000
        }))
      
      allVideos = [...allVideos, ...videos]
      nextPageToken = data.nextPageToken || ''
      
    } while (nextPageToken)
    
    return allVideos
  } catch (error) {
    throw new Error('Failed to fetch playlist videos')
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
  return Math.ceil(videoCount * Math.log2(videoCount))
}

export function getRankedVideos(videos: Video[]): Video[] {
  return [...videos].sort((a, b) => b.score - a.score)
}
