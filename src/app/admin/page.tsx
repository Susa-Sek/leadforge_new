'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, UserPlus, Search, Euro, Crown } from 'lucide-react'
import { StatsCard } from '@/components/admin/stats-card'
import { StatsChart } from '@/components/admin/stats-chart'
import { DateRangePicker } from '@/components/admin/date-range-picker'
import { DateRange } from 'react-day-picker'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import {
  useAdminStats,
  useUserRegistrationChart,
  useSearchesChart,
  useRevenueChart,
} from '@/hooks/use-admin'
import { cn } from '@/lib/utils'

export default function AdminDashboardPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(subDays(new Date(), 30)),
    to: endOfDay(new Date()),
  })

  const days = dateRange?.from && dateRange?.to
    ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
    : 30

  const { stats, isLoading: statsLoading } = useAdminStats(days)
  const { chartData: registrationChart, isLoading: registrationLoading } = useUserRegistrationChart(days)
  const { chartData: searchesChart, isLoading: searchesLoading } = useSearchesChart(days)
  const { chartData: revenueChart, isLoading: revenueLoading } = useRevenueChart(days)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin-Übersicht</h1>
          <p className="text-muted-foreground">
            Übersicht über alle wichtigen Kennzahlen
          </p>
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Aktive Nutzer"
          value={stats?.activeUsers.toLocaleString() ?? '0'}
          trend={stats?.activeUsersTrend}
          trendLabel="vs. Vorperiode"
          icon={Users}
          color="blue"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Neue Registrierungen"
          value={stats?.newRegistrations.toLocaleString() ?? '0'}
          trend={stats?.newRegistrationsTrend}
          trendLabel="vs. Vorperiode"
          icon={UserPlus}
          color="green"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Suchen heute"
          value={stats?.searchesToday.toLocaleString() ?? '0'}
          trend={stats?.searchesTrend}
          trendLabel="vs. gestern"
          icon={Search}
          color="purple"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Umsatz"
          value={`${stats?.revenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) ?? '0 €'}`}
          trend={stats?.revenueTrend}
          trendLabel="vs. Vorperiode"
          icon={Euro}
          color="orange"
          isLoading={statsLoading}
          subtitle={`Konversion: ${stats?.conversionRate.toFixed(1)}%`}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatsChart
          title="Neuregistrierungen"
          data={registrationChart?.data || []}
          type="area"
          color="#22c55e"
          gradientFrom="#22c55e"
          gradientTo="#86efac"
          isLoading={registrationLoading}
        />
        <StatsChart
          title="Suchen pro Tag"
          data={searchesChart?.data || []}
          type="bar"
          color="#a855f7"
          isLoading={searchesLoading}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konversionsrate</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                `${stats?.conversionRate.toFixed(1) ?? '0'}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Free → Paid Conversion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn-Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                `${stats?.churnRate.toFixed(1) ?? '0'}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Monatliche Abwanderung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamt-Umsatz</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenueLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                revenueChart?.total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) ?? '0 €'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Im ausgewählten Zeitraum
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Users Section */}
      <Card>
        <CardHeader>
          <CardTitle>Top-Nutzer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Die Top-Nutzer-Tabelle wird hier angezeigt. Verwenden Sie die Nutzerverwaltung für detaillierte Informationen.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
