export interface Video {
  id: string
  title: string
  thumbnail: string
  score: number
}

export interface ComparisonPair {
  videoA: Video
  videoB: Video
}

export interface ComparisonResult {
  winnerId: string
  loserId: string
}
