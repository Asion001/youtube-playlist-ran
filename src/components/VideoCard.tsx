import { Video } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Play } from '@phosphor-icons/react'

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
      className="flex-1 flex flex-col"
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
        <a
          href={`https://www.youtube.com/watch?v=${video.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative aspect-video bg-muted overflow-hidden group block"
        >
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-colors group-hover:bg-black/50">
            <div className="bg-primary/90 rounded-full p-4 transition-transform duration-300 group-hover:scale-110">
              <Play size={32} weight="fill" className="text-primary-foreground" />
            </div>
          </div>
        </a>

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
