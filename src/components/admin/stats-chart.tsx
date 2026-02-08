'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'

type ChartType = 'line' | 'bar' | 'area'

import type { ChartDataPoint } from '@/lib/admin/types'
export type { ChartDataPoint }

interface StatsChartProps {
  title: string
  data: ChartDataPoint[]
  type?: ChartType
  dataKey?: string
  color?: string
  gradientFrom?: string
  gradientTo?: string
  isLoading?: boolean
  showLegend?: boolean
  showGrid?: boolean
  className?: string
  yAxisFormatter?: (value: number) => string
  tooltipFormatter?: (value: number) => string
  multiLine?: {
    dataKeys: string[]
    colors: string[]
    labels: string[]
  }
}

const defaultColors = {
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#a855f7',
  orange: '#f97316',
  red: '#ef4444',
}

export function StatsChart({
  title,
  data,
  type = 'line',
  dataKey = 'value',
  color = '#3b82f6',
  gradientFrom = '#3b82f6',
  gradientTo = '#60a5fa',
  isLoading = false,
  showLegend = false,
  showGrid = true,
  className,
  yAxisFormatter = (value) => value.toString(),
  tooltipFormatter = (value) => value.toString(),
  multiLine,
}: StatsChartProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-[150px]" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    )
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
    })
  }

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: 0, bottom: 0 },
    }

    const axisProps = {
      xAxis: {
        dataKey: 'date',
        tickFormatter: formatDate,
        stroke: 'hsl(var(--muted-foreground))',
        fontSize: 12,
        tickLine: false,
        axisLine: false,
      },
      yAxis: {
        stroke: 'hsl(var(--muted-foreground))',
        fontSize: 12,
        tickLine: false,
        axisLine: false,
        tickFormatter: yAxisFormatter,
      },
    }

    const tooltipProps = {
      contentStyle: {
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '6px',
        fontSize: '12px',
      } as React.CSSProperties,
      labelStyle: { color: 'hsl(var(--foreground))' } as React.CSSProperties,
      formatter: (value: number | undefined) => [tooltipFormatter(value ?? 0), ''] as [string, string],
      labelFormatter: (label: React.ReactNode) => formatDate(String(label)),
    }

    if (multiLine && type === 'line') {
      return (
        <LineChart {...commonProps}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          )}
          <XAxis {...axisProps.xAxis} />
          <YAxis {...axisProps.yAxis} />
          <Tooltip {...tooltipProps} />
          {showLegend && <Legend />}
          {multiLine.dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={multiLine.colors[index]}
              strokeWidth={2}
              dot={false}
              name={multiLine.labels[index]}
            />
          ))}
        </LineChart>
      )
    }

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            )}
            <XAxis {...axisProps.xAxis} />
            <YAxis {...axisProps.yAxis} />
            <Tooltip {...tooltipProps} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
            />
          </LineChart>
        )

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            )}
            <XAxis {...axisProps.xAxis} />
            <YAxis {...axisProps.yAxis} />
            <Tooltip {...tooltipProps} />
            <Bar
              dataKey={dataKey}
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        )

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            )}
            <XAxis {...axisProps.xAxis} />
            <YAxis {...axisProps.yAxis} />
            <Tooltip {...tooltipProps} />
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={gradientFrom} stopOpacity={0.3} />
                <stop offset="95%" stopColor={gradientTo} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${title})`}
            />
          </AreaChart>
        )

      default:
        return null
    }
  }

  return (
    <Card className={cn('hover-lift', className)}>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
