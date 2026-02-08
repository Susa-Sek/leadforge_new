'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  trend?: number // percentage
  trendLabel?: string
  icon: LucideIcon
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  isLoading?: boolean
  subtitle?: string
}

const colorVariants = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  green: 'bg-green-500/10 text-green-600 dark:text-green-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400',
}

export function StatsCard({
  title,
  value,
  trend,
  trendLabel,
  icon: Icon,
  color = 'blue',
  isLoading = false,
  subtitle,
}: StatsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[80px] mb-2" />
          <Skeleton className="h-4 w-[120px]" />
        </CardContent>
      </Card>
    )
  }

  const isPositiveTrend = trend && trend >= 0
  const isNegativeTrend = trend && trend < 0

  return (
    <Card className="hover-lift">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-full', colorVariants[color])}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            {isPositiveTrend && (
              <>
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500 font-medium">
                  +{trend.toFixed(1)}%
                </span>
              </>
            )}
            {isNegativeTrend && (
              <>
                <TrendingDown className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-500 font-medium">
                  {trend.toFixed(1)}%
                </span>
              </>
            )}
            {trendLabel && (
              <span className="text-xs text-muted-foreground ml-1">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
