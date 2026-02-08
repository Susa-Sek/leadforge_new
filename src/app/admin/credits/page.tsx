'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Coins, ArrowUpCircle, ArrowDownCircle, User } from 'lucide-react'
import { CreditAdjustmentForm } from '@/components/admin/credit-adjustment-form'
import { useAdminCredits, useAdjustCredits } from '@/hooks/use-admin'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminCreditsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const { adjustments, total, page, limit, totalPages, isLoading, mutate } = useAdminCredits(
    undefined,
    currentPage,
    20
  )

  const filteredAdjustments = adjustments.filter(
    (adj) =>
      adj.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adj.reason.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Credit-Verwaltung</h1>
        <p className="text-muted-foreground">
          Credits anpassen und Transaktionen verwalten
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Adjustment Form */}
        <div className="lg:col-span-1">
          <CreditAdjustmentForm onSuccess={() => mutate()} />
        </div>

        {/* Recent Transactions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Letzte Transaktionen
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Suchen..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : filteredAdjustments.length > 0 ? (
                  <div className="space-y-2">
                    {filteredAdjustments.map((adjustment) => (
                      <div
                        key={adjustment.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              'h-8 w-8 rounded-full flex items-center justify-center',
                              adjustment.amount > 0
                                ? 'bg-green-100 dark:bg-green-900'
                                : 'bg-red-100 dark:bg-red-900'
                            )}
                          >
                            {adjustment.amount > 0 ? (
                              <ArrowUpCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : (
                              <ArrowDownCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="font-medium">
                                {adjustment.user_name || adjustment.user_email}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {adjustment.reason}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <span>Durch: {adjustment.admin_email}</span>
                              <span>•</span>
                              <span>
                                {format(
                                  new Date(adjustment.created_at),
                                  'dd.MM.yyyy HH:mm'
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={adjustment.amount > 0 ? 'default' : 'destructive'}
                            className="text-sm"
                          >
                            {adjustment.amount > 0 ? '+' : ''}
                            {adjustment.amount}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Keine Transaktionen gefunden
                  </div>
                )}
              </ScrollArea>

              {/* Pagination */}
              {!isLoading && totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Zeige {(page - 1) * limit + 1} bis{' '}
                    {Math.min(page * limit, total)} von {total}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                      onClick={() => setCurrentPage(page - 1)}
                      disabled={page === 1}
                    >
                      Zurück
                    </button>
                    <span className="text-sm text-muted-foreground">
                      Seite {page} von {totalPages}
                    </span>
                    <button
                      className="px-3 py-1 border rounded text-sm disabled:opacity-50"
                      onClick={() => setCurrentPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Weiter
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
