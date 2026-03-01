import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Lightning } from '@phosphor-icons/react'

interface ComparisonProgressProps {
  current: number
  total: number
}

export function ComparisonProgress({ current, total }: ComparisonProgressProps) {
  const percentage = Math.round((current / total) * 100)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightning size={20} weight="fill" className="text-accent" />
          <span className="text-sm font-medium">Comparison Progress</span>
        </div>
        <Badge variant="secondary" className="font-mono">
          {current} / {total}
        </Badge>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-muted-foreground text-center">
        {percentage}% complete
      </p>
    </div>
  )
}
