import { useEffect, useRef, useId } from 'react'

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
  const uniqueId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const ytPlayerRef = useRef<any>(null)
  const playerIdRef = useRef<string>(`yt-player-${uniqueId.replace(/:/g, '-')}`)

  useEffect(() => {
    const initPlayer = () => {
      if (!containerRef.current) return

      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy()
        } catch (e) {
          console.warn('Error destroying player:', e)
        }
        ytPlayerRef.current = null
      }

      const playerDiv = document.createElement('div')
      playerDiv.id = playerIdRef.current
      containerRef.current.innerHTML = ''
      containerRef.current.appendChild(playerDiv)

      ytPlayerRef.current = new window.YT.Player(playerIdRef.current, {
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
          enablejsapi: 1,
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
          try {
            ytPlayerRef.current.destroy()
          } catch (e) {
            console.warn('Error destroying player on cleanup:', e)
          }
        }
      }
    }

    return () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy()
        } catch (e) {
          console.warn('Error destroying player on cleanup:', e)
        }
        ytPlayerRef.current = null
      }
    }
  }, [videoId])

  return <div ref={containerRef} className={className} />
}
