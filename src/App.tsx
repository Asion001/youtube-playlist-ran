import { useState } from 'react'
import { useKV } from '@github/spark/hooks'
import { Video } from '@/lib/types'
import {
  extractPlaylistId,
  fetchPlaylistVideos,
  calculateNextPair,
  updateScores,
  calculateMinimumComparisons,
  getRankedVideos,
} from '@/lib/ranking'
import { VideoCard } from '@/components/VideoCard'
import { ComparisonProgress } from '@/components/ComparisonProgress'
import { RankingResults } from '@/components/RankingResults'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatePresence } from 'framer-motion'
import { ArrowCounterClockwise, Lightning } from '@phosphor-icons/react'
import { toast } from 'sonner'

type AppState = 'input' | 'loading' | 'comparing' | 'results'

function App() {
  const [state, setState] = useState<AppState>('input')
  const [playlistUrl, setPlaylistUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)

  const [videos, setVideos] = useKV<Video[]>('playlist-videos', [])
  const [comparisonCount, setComparisonCount] = useKV<number>('comparison-count', 0)
  const [currentPair, setCurrentPair] = useState<[Video, Video] | null>(null)

  const minimumComparisons = videos && videos.length > 0 ? calculateMinimumComparisons(videos.length) : 0

  const handleSubmit = async () => {
    setError(null)
    const playlistId = extractPlaylistId(playlistUrl)

    if (!playlistId) {
      setError('Invalid YouTube playlist URL. Please check the URL and try again.')
      return
    }

    setState('loading')

    try {
      const fetchedVideos = await fetchPlaylistVideos(playlistId)

      if (fetchedVideos.length < 2) {
        setError('Playlist must contain at least 2 videos to rank.')
        setState('input')
        return
      }

      setVideos(fetchedVideos)
      setComparisonCount(0)
      setState('comparing')

      const pair = calculateNextPair(fetchedVideos)
      setCurrentPair(pair)
      
      toast.success(`Loaded ${fetchedVideos.length} videos!`)
    } catch (err) {
      setError('Failed to load playlist. Please check the URL and try again.')
      setState('input')
    }
  }

  const handleChoice = (winnerId: string) => {
    if (!currentPair || isSelecting || !videos || comparisonCount === undefined) return

    setIsSelecting(true)

    const loserId = currentPair[0].id === winnerId ? currentPair[1].id : currentPair[0].id

    setTimeout(() => {
      setVideos((currentVideos) => {
        if (!currentVideos) return []
        
        const updatedVideos = updateScores(currentVideos, winnerId, loserId)
        const newCount = (comparisonCount ?? 0) + 1

        setComparisonCount(newCount)

        if (newCount >= minimumComparisons) {
          setState('results')
          toast.success('Ranking complete!')
          return updatedVideos
        }

        const nextPair = calculateNextPair(updatedVideos)
        setCurrentPair(nextPair)
        setIsSelecting(false)

        return updatedVideos
      })
    }, 150)
  }

  const handleReset = () => {
    setState('input')
    setPlaylistUrl('')
    setVideos([])
    setComparisonCount(0)
    setCurrentPair(null)
    setError(null)
    setIsSelecting(false)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,oklch(0.25_0.08_250),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,oklch(0.20_0.10_290),transparent_40%)]" />
      
      <div className="relative z-10 container mx-auto px-6 py-8 md:px-12 md:py-12">
        <header className="text-center space-y-2 mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight flex items-center justify-center gap-3">
            <Lightning size={40} weight="fill" className="text-accent" />
            Playlist Ranker
          </h1>
          <p className="text-muted-foreground text-lg">
            Find the best video in your YouTube playlist through pairwise comparison
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          {state === 'input' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    id="playlist-url"
                    type="text"
                    placeholder="Paste YouTube playlist URL..."
                    value={playlistUrl}
                    onChange={(e) => setPlaylistUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="flex-1 h-12 text-base"
                  />
                  <Button
                    onClick={handleSubmit}
                    size="lg"
                    className="h-12 px-8"
                  >
                    Start Ranking
                  </Button>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="bg-card rounded-lg border p-6 space-y-4">
                <h3 className="font-semibold text-lg">How it works</h3>
                <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                  <li>Paste a YouTube playlist URL above</li>
                  <li>We'll load all videos from the playlist</li>
                  <li>Choose between pairs of videos (A or B)</li>
                  <li>After enough comparisons, see your final ranking</li>
                </ol>
              </div>
            </div>
          )}

          {state === 'loading' && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground">Loading playlist videos...</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <Skeleton className="h-64 rounded-lg" />
                <Skeleton className="h-64 rounded-lg" />
              </div>
            </div>
          )}

          {state === 'comparing' && currentPair && (
            <div className="space-y-8">
              <ComparisonProgress current={comparisonCount ?? 0} total={minimumComparisons} />

              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">Which video is better?</h2>
                <p className="text-muted-foreground">Click on your preferred video</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                <AnimatePresence mode="wait">
                  <VideoCard
                    key={currentPair[0].id}
                    video={currentPair[0]}
                    label="A"
                    onSelect={() => handleChoice(currentPair[0].id)}
                    isSelecting={isSelecting}
                  />
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  <VideoCard
                    key={currentPair[1].id}
                    video={currentPair[1]}
                    label="B"
                    onSelect={() => handleChoice(currentPair[1].id)}
                    isSelecting={isSelecting}
                  />
                </AnimatePresence>
              </div>
            </div>
          )}

          {state === 'results' && videos && (
            <div className="space-y-6">
              <RankingResults videos={getRankedVideos(videos)} />

              <div className="flex justify-center">
                <Button onClick={handleReset} size="lg" variant="outline">
                  <ArrowCounterClockwise size={20} />
                  Rank Another Playlist
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App