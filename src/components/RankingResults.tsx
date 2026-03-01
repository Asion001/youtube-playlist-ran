import { Video } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion } from 'framer-motion'
import { Trophy } from '@phosphor-icons/react'

interface RankingResultsProps {
  videos: Video[]
}

export function RankingResults({ videos }: RankingResultsProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Trophy size={32} weight="fill" className="text-accent" />
          <h2 className="text-3xl font-bold">Final Rankings</h2>
        </div>
        <p className="text-muted-foreground">
          Here are your videos ranked from best to worst
        </p>
      </div>

      <ScrollArea className="pr-4">
        <div className="space-y-3">
          {videos.map((video, index) => (
            <motion.div
              key={video.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
            >
              <Card className="p-4 hover:border-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>

                  <div className="flex-shrink-0 w-32 h-18 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base leading-tight line-clamp-2">
                      {video.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Score: {Math.round(video.score)}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
