import { Video } from '@/lib/types'
import { Card } from '@/components/ui/card'
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
      className="flex-1"
    >
      <Card
        onClick={onSelect}
        className="relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-accent/20 group border-2 hover:border-accent/50 active:scale-95"
      >
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-primary text-primary-foreground font-bold text-xl w-10 h-10 rounded-full flex items-center justify-center">
            {label}
          </div>
        </div>

        <div className="relative aspect-video bg-muted overflow-hidden">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent opacity-80" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-accent/90 text-accent-foreground rounded-full p-4">
              <Play size={32} weight="fill" />
            </div>
          </div>
        </div>

        <div className="p-6">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">
            {video.title}
          </h3>
        </div>
      </Card>
    </motion.div>
  )
}
