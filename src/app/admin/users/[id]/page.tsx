'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  User,
  Mail,
  Building,
  Coins,
  Calendar,
  Ban,
  UserCheck,
  Crown,
  Activity,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  useAdminUser,
  useSuspendUser,
  useUnsuspendUser,
  useChangeUserPlan,
} from '@/hooks/use-admin'
import { CreditAdjustmentForm } from '@/components/admin/credit-adjustment-form'
import { cn } from '@/lib/utils'

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

export default function AdminUserDetailPage() {
  const params = useParams()
  const userId = params.id as string
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const { user, isLoading, mutate } = useAdminUser(userId)
  const { trigger: suspendUser } = useSuspendUser()
  const { trigger: unsuspendUser } = useUnsuspendUser()
  const { trigger: changePlan } = useChangeUserPlan()

  const handleSuspend = async () => {
    try {
      await suspendUser({ id: userId })
      toast.success('Nutzer wurde gesperrt')
      mutate()
    } catch (error) {
      toast.error('Fehler beim Sperren des Nutzers')
    }
  }

  const handleUnsuspend = async () => {
    try {
      await unsuspendUser(userId)
      toast.success('Nutzer wurde entsperrt')
      mutate()
    } catch (error) {
      toast.error('Fehler beim Entsperren des Nutzers')
    }
  }

  const handleChangePlan = async (plan: 'free' | 'pro' | 'enterprise') => {
    try {
      await changePlan({ id: userId, plan })
      toast.success('Tarif wurde geändert')
      mutate()
    } catch (error) {
      toast.error('Fehler beim Ändern des Tarifs')
    }
  }

  if (isLoading || !user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {user.full_name || 'Unbekannt'}
          </h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <Badge className={cn(statusColors[user.status], 'text-white ml-auto')}>
          {statusLabels[user.status]}
        </Badge>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="info">Informationen</TabsTrigger>
          <TabsTrigger value="credits">Credits</TabsTrigger>
          <TabsTrigger value="activity">Aktivität</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profilinformationen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <User className="h-8 w-8 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">{user.full_name || 'Unbekannt'}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  {user.profile?.company && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{user.profile.company}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Registriert: {format(new Date(user.created_at), 'dd.MM.yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span>Logins: {user.login_count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      Letzter Login:{' '}
                      {user.last_login_at
                        ? format(new Date(user.last_login_at), 'dd.MM.yyyy HH:mm')
                        : 'Nie'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan & Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Tarif & Aktionen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Aktueller Tarif</label>
                  <Select
                    value={user.plan}
                    onValueChange={(value) => handleChangePlan(value as 'free' | 'pro' | 'enterprise')}
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
                </div>

                {user.subscription && (
                  <div className="text-sm text-muted-foreground space-y-1 p-3 bg-slate-50 dark:bg-slate-800 rounded">
                    <p>Status: {user.subscription.status}</p>
                    <p>
                      Periode:{' '}
                      {user.subscription.current_period_start
                        ? format(new Date(user.subscription.current_period_start), 'dd.MM.yyyy')
                        : '-'}{' '}
                      -{' '}
                      {user.subscription.current_period_end
                        ? format(new Date(user.subscription.current_period_end), 'dd.MM.yyyy')
                        : '-'}
                    </p>
                    {user.subscription.cancel_at_period_end && (
                      <p className="text-orange-500">Wird am Periodenende gekündigt</p>
                    )}
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  {user.status === 'active' ? (
                    <Button variant="destructive" className="w-full" onClick={handleSuspend}>
                      <Ban className="mr-2 h-4 w-4" />
                      Nutzer sperren
                    </Button>
                  ) : (
                    <Button variant="default" className="w-full" onClick={handleUnsuspend}>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Nutzer entsperren
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="credits" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CreditAdjustmentForm onSuccess={() => mutate()} />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5" />
                  Transaktionsverlauf
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">
                  {user.credits_balance}{' '}
                  <span className="text-lg font-normal text-muted-foreground">Credits</span>
                </div>
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
                            <p
                              className={cn(
                                'font-medium',
                                tx.amount > 0 ? 'text-green-500' : 'text-red-500'
                              )}
                            >
                              {tx.amount > 0 ? '+' : ''}
                              {tx.amount}
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Aktivitätsverlauf
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {user.activity?.length > 0 ? (
                    user.activity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 border rounded"
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
