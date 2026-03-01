import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: () => void
  }
}

interface YouTubePlayerProps {
  videoId: string
  className?: string
}

export function YouTubePlayer({ videoId, className = '' }: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null)
  const ytPlayerRef = useRef<any>(null)

  useEffect(() => {
    const initPlayer = () => {
      if (!playerRef.current) return

      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy()
      }

      ytPlayerRef.current = new window.YT.Player(playerRef.current, {
        videoId: videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          modestbranding: 1,
          rel: 0,
          controls: 1,
          showinfo: 0,
          fs: 1,
          origin: window.location.origin,
        },
        events: {
          onError: (event: any) => {
            console.log('YouTube Player Error:', event.data)
          },
        },
      })
    }

    if (window.YT && window.YT.Player) {
      initPlayer()
    } else {
      const checkYT = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkYT)
          initPlayer()
        }
      }, 100)

      return () => {
        clearInterval(checkYT)
        if (ytPlayerRef.current) {
          ytPlayerRef.current.destroy()
        }
      }
    }

    return () => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy()
      }
    }
  }, [videoId])

  return <div ref={playerRef} className={className} />
}
