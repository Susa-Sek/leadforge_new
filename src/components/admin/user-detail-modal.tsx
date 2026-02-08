'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  User,
  Mail,
  Building,
  Coins,
  Calendar,
  Ban,
  UserCheck,
  Crown,
  Activity,
  CreditCard,
} from 'lucide-react'
import type { AdminUserDetail } from '@/lib/admin/types'
import { cn } from '@/lib/utils'

interface UserDetailModalProps {
  user: AdminUserDetail | null
  isOpen: boolean
  onClose: () => void
  onSuspend: () => void
  onUnsuspend: () => void
  onChangePlan: (plan: 'free' | 'pro' | 'enterprise') => void
  isLoading?: boolean
}

const planOptions = [
  { value: 'free', label: 'Free', color: 'bg-slate-500' },
  { value: 'pro', label: 'Pro', color: 'bg-blue-500' },
  { value: 'enterprise', label: 'Enterprise', color: 'bg-purple-500' },
]

const statusColors = {
  active: 'bg-green-500',
  suspended: 'bg-red-500',
  pending: 'bg-yellow-500',
}

const statusLabels = {
  active: 'Aktiv',
  suspended: 'Gesperrt',
  pending: 'Ausstehend',
}

export function UserDetailModal({
  user,
  isOpen,
  onClose,
  onSuspend,
  onUnsuspend,
  onChangePlan,
  isLoading = false,
}: UserDetailModalProps) {
  const [selectedPlan, setSelectedPlan] = useState(user?.plan || 'free')

  if (isLoading || !user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <Skeleton className="h-6 w-[200px]" />
          </DialogHeader>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Nutzerdetails
            <Badge className={cn(statusColors[user.status], 'text-white ml-2')}>
              {statusLabels[user.status]}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informationen</TabsTrigger>
            <TabsTrigger value="credits">Credits</TabsTrigger>
            <TabsTrigger value="activity">Aktivität</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <User className="h-8 w-8 text-slate-500" />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-lg font-semibold">
                  {user.full_name || 'Unbekannt'}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </div>
                {user.profile?.company && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Building className="h-4 w-4" />
                    {user.profile.company}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Tarif
                </h4>
                <Select
                  value={selectedPlan}
                  onValueChange={(value) => {
                    setSelectedPlan(value as typeof selectedPlan)
                    onChangePlan(value as 'free' | 'pro' | 'enterprise')
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {planOptions.map((plan) => (
                      <SelectItem key={plan.value} value={plan.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn('h-2 w-2 rounded-full', plan.color)} />
                          {plan.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {user.subscription && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Status: {user.subscription.status}</p>
                    <p>Periode: {format(new Date(user.subscription.current_period_start || ''), 'dd.MM.yyyy')} - {format(new Date(user.subscription.current_period_end || ''), 'dd.MM.yyyy')}</p>
                  </div>
                )}
              </div>

              <div className="p-4 border rounded-lg space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Account-Status
                </h4>
                <div className="space-y-2">
                  {user.status === 'active' ? (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={onSuspend}
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Nutzer sperren
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={onUnsuspend}
                    >
                      <UserCheck className="mr-2 h-4 w-4" />
                      Nutzer entsperren
                    </Button>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Registriert: {format(new Date(user.created_at), 'dd.MM.yyyy')}</p>
                  <p>Logins: {user.login_count}</p>
                  <p>Letzter Login: {user.last_login_at ? format(new Date(user.last_login_at), 'dd.MM.yyyy HH:mm') : 'Nie'}</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="credits" className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <span className="text-lg font-medium">Aktuelles Guthaben</span>
                </div>
                <span className={cn(
                  'text-2xl font-bold',
                  user.credits_balance < 10 && 'text-red-500'
                )}>
                  {user.credits_balance} Credits
                </span>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-4">Transaktionsverlauf</h4>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {user.credit_transactions?.length > 0 ? (
                    user.credit_transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div>
                          <p className="font-medium">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.created_at), 'dd.MM.yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            'font-medium',
                            tx.amount > 0 ? 'text-green-500' : 'text-red-500'
                          )}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Saldo: {tx.balance_after}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Keine Transaktionen vorhanden
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-4">Aktivitätsverlauf</h4>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {user.activity?.length > 0 ? (
                    user.activity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-2 border rounded"
                      >
                        <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(activity.created_at), 'dd.MM.yyyy HH:mm')}
                          </p>
                          {activity.details && Object.keys(activity.details).length > 0 && (
                            <pre className="mt-2 text-xs bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-x-auto">
                              {JSON.stringify(activity.details, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Keine Aktivitäten vorhanden
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
