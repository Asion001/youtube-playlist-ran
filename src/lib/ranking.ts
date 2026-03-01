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
  const prompt = spark.llmPrompt`You are a YouTube API simulator. Generate a realistic playlist with 8-12 videos based on this playlist ID: ${playlistId}.

Return a JSON object with a "videos" property containing an array of video objects. Each video should have:
- id: unique video ID (11 chars, alphanumeric)
- title: realistic video title (relevant to a theme you infer from the ID, or make it a generic educational/entertainment playlist)
- thumbnail: use "https://i.ytimg.com/vi/{VIDEO_ID}/mqdefault.jpg" format
- score: always start at 1000

Make the videos feel like a real playlist - related theme, varied but coherent titles.

Return ONLY valid JSON in this exact format:
{
  "videos": [
    {"id": "dQw4w9WgXcQ", "title": "Example Video Title", "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg", "score": 1000}
  ]
}`

  try {
    const response = await spark.llm(prompt, 'gpt-4o-mini', true)
    const data = JSON.parse(response)
    return data.videos
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
