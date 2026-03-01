import { Video } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { YouTubePlayer } from './YouTubePlayer'

interface VideoCardProps {
  video: Video
  label: 'A' | 'B'
  onSelect: () => void
  isSelecting: boolean
}

export function VideoCard({ video, label, onSelect, isSelecting }: VideoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: label === 'A' ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="w-full md:w-[45vw] flex flex-col"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-primary text-primary-foreground font-bold text-lg w-9 h-9 rounded-full flex items-center justify-center shrink-0">
          {label}
        </div>
        <h3 className="font-semibold text-lg leading-tight">
          {video.title}
        </h3>
      </div>

      <Card className="overflow-hidden border-2 flex flex-col flex-1">
        <div className="relative aspect-video bg-muted overflow-hidden">
          <YouTubePlayer videoId={video.id} className="absolute inset-0 w-full h-full" />
        </div>

        <div className="p-4">
          <Button
            onClick={onSelect}
            disabled={isSelecting}
            size="lg"
            className="w-full"
          >
            Choose {label}
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
