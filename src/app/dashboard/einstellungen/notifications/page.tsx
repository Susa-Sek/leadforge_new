'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  Moon,
  AlertCircle,
  Crown,
  Building2,
  Loader2,
  Save,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { useNotificationPreferences } from '@/hooks/use-notifications'
import { usePlan } from '@/hooks/use-plan'
import {
  NotificationType,
  DELIVERY_METHOD_LABELS,
  NOTIFICATION_TYPE_LABELS,
  NOTIFICATION_TYPE_DESCRIPTIONS,
  NOTIFICATION_LIMITS,
  DeliveryMethod,
  NotificationPreference,
} from '@/lib/notifications/types'
import { cn } from '@/lib/utils'

// Group notification types by category (aligned with backend types)
const CATEGORIES = {
  search_export: ['search_complete', 'search_failed', 'export_complete', 'export_failed'] as NotificationType[],
  credits: ['low_credits', 'credits_depleted', 'credit_purchase_success'] as NotificationType[],
  crm: ['deal_status_change', 'deal_assigned', 'deal_deadline_approaching'] as NotificationType[],
  system: ['system_maintenance', 'system_announcement'] as NotificationType[],
  subscription: ['subscription_expiring', 'subscription_expired'] as NotificationType[],
}

const CATEGORY_LABELS = {
  search_export: 'Suche & Export',
  credits: 'Guthaben',
  crm: 'CRM & Deals',
  system: 'System',
  subscription: 'Abonnement',
}

export default function NotificationSettingsPage() {
  const {
    preferences,
    isLoading,
    error,
    savePreferences,
    toggleType,
    setQuietHours,
    hasChanges,
  } = useNotificationPreferences()
  const { subscription } = usePlan()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Get plan type and limits
  const plan = subscription?.plan || 'free'
  const limits = NOTIFICATION_LIMITS[plan as keyof typeof NOTIFICATION_LIMITS]

  // Check feature availability
  const canUseEmail = limits.email > 0
  const canUsePush = limits.push > 0

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setSaveError(null)
    try {
      await savePreferences()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setIsSaving(false)
    }
  }, [savePreferences])

  // Get preference for a type
  const getPreference = (type: NotificationType): NotificationPreference | undefined => {
    return preferences?.perType.find((p) => p.type === type)
  }

  // Check if a type/channel is enabled
  const isEnabled = (type: NotificationType, channel: DeliveryMethod): boolean => {
    const pref = getPreference(type)
    return pref ? pref[channel] : true
  }

  // Loading state
  if (isLoading && !preferences) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
  if (error && !preferences) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!preferences) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Benachrichtigungseinstellungen
            </h1>
            <p className="text-sm text-muted-foreground">
              Verwalte deine Benachrichtigungen und Delivery-Methoden
            </p>
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Wird gespeichert...' : 'Speichern'}
        </Button>
      </div>

      {/* Save Error */}
      {saveError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{saveError}</AlertDescription>
        </Alert>
      )}

      {/* Delivery Methods Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Delivery-Methoden Übersicht</CardTitle>
          <CardDescription>
            Wähle aus, wie du Benachrichtigungen erhalten möchtest
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* In-App */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <Label className="font-medium">{DELIVERY_METHOD_LABELS.in_app}</Label>
                <p className="text-sm text-muted-foreground">
                  Benachrichtigungen in der App und als Toast
                </p>
              </div>
            </div>
            <Badge variant={preferences.in_app_enabled ? 'default' : 'secondary'}>
              {preferences.in_app_enabled ? 'Aktiviert' : 'Deaktiviert'}
            </Badge>
          </div>

          <Separator />

          {/* Email */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'rounded-full p-2',
                canUseEmail ? 'bg-purple-100 dark:bg-purple-900/20' : 'bg-muted'
              )}>
                <Mail className={cn(
                  'h-4 w-4',
                  canUseEmail ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label className={cn('font-medium', !canUseEmail && 'text-muted-foreground')}>
                    {DELIVERY_METHOD_LABELS.email}
                  </Label>
                  {!canUseEmail && (
                    <Badge variant="secondary" className="text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Pro
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {canUseEmail
                    ? 'Benachrichtigungen per E-Mail erhalten'
                    : 'Upgrade auf Pro für E-Mail-Benachrichtigungen'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!canUseEmail && (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/upgrade">
                    Upgrade
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              )}
              <Badge variant={canUseEmail && preferences.email_enabled ? 'default' : 'secondary'}>
                {canUseEmail && preferences.email_enabled ? 'Aktiviert' : 'Deaktiviert'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Push */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'rounded-full p-2',
                canUsePush ? 'bg-green-100 dark:bg-green-900/20' : 'bg-muted'
              )}>
                <Smartphone className={cn(
                  'h-4 w-4',
                  canUsePush ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                )} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Label className={cn('font-medium', !canUsePush && 'text-muted-foreground')}>
                    {DELIVERY_METHOD_LABELS.push}
                  </Label>
                  {!canUsePush && (
                    <Badge variant="secondary" className="text-xs">
                      <Building2 className="h-3 w-3 mr-1" />
                      Enterprise
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {canUsePush
                    ? 'Push-Benachrichtigungen auf deinem Gerät'
                    : 'Kontaktiere uns für Push-Benachrichtigungen'}
                </p>
              </div>
            </div>
            <Badge variant={canUsePush && preferences.push_enabled ? 'default' : 'secondary'}>
              {canUsePush && preferences.push_enabled ? 'Aktiviert' : 'Deaktiviert'}
            </Badge>
          </div>
        </CardContent>

        {/* Plan Limits Info */}
        <CardFooter className="bg-muted/50 border-t px-6 py-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">Dein Plan: {plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
              <p>
                In-App: {limits.inApp === Infinity ? 'Unbegrenzt' : `${limits.inApp}/Monat`}
                {limits.email > 0 && ` • E-Mail: ${limits.email}/Monat`}
                {limits.push > 0 && ` • Push: Unbegrenzt`}
              </p>
            </div>
          </div>
        </CardFooter>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Ruhezeiten
          </CardTitle>
          <CardDescription>
            Lege fest, wann du keine E-Mail-Benachrichtigungen erhalten möchtest
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Von</span>
            </div>
            <Input
              type="time"
              value={preferences.quiet_hours_start || '22:00'}
              onChange={(e) => {
                // Use first type as reference for quiet hours
                const firstType = preferences.perType[0]?.type || 'search_complete'
                setQuietHours(firstType, e.target.value, preferences.quiet_hours_end || '08:00')
              }}
              className="w-[120px]"
            />
            <span className="text-sm text-muted-foreground">bis</span>
            <Input
              type="time"
              value={preferences.quiet_hours_end || '08:00'}
              onChange={(e) => {
                const firstType = preferences.perType[0]?.type || 'search_complete'
                setQuietHours(firstType, preferences.quiet_hours_start || '22:00', e.target.value)
              }}
              className="w-[120px]"
            />
            <p className="text-sm text-muted-foreground">
              Keine E-Mail-Benachrichtigungen in dieser Zeit
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Benachrichtigungstypen</CardTitle>
          <CardDescription>
            Wähle für jeden Typ aus, über welche Kanäle du benachrichtigt werden möchtest
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(CATEGORIES).map(([category, types], categoryIndex) => (
            <div key={category}>
              {categoryIndex > 0 && <Separator className="my-4" />}
              <h3 className="font-medium text-sm text-muted-foreground mb-3">
                {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
              </h3>
              <div className="space-y-4">
                {types.map((type) => {
                  const pref = getPreference(type)
                  if (!pref) return null

                  return (
                    <div key={type} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Label className="font-medium">
                            {NOTIFICATION_TYPE_LABELS[type]}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {NOTIFICATION_TYPE_DESCRIPTIONS[type]}
                          </p>
                        </div>
                      </div>

                      {/* Channel toggles for this type */}
                      <div className="flex flex-wrap gap-4">
                        {/* In-App */}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={pref.in_app}
                            onCheckedChange={(checked) => toggleType(type, 'in_app', checked)}
                            id={`${type}-in_app`}
                          />
                          <Label htmlFor={`${type}-in_app`} className="text-sm">
                            In-App
                          </Label>
                        </div>

                        {/* Email */}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={pref.email}
                            onCheckedChange={(checked) => toggleType(type, 'email', checked)}
                            disabled={!canUseEmail}
                            id={`${type}-email`}
                          />
                          <Label htmlFor={`${type}-email`} className={cn('text-sm', !canUseEmail && 'text-muted-foreground')}>
                            E-Mail
                          </Label>
                        </div>

                        {/* Push */}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={pref.push}
                            onCheckedChange={(checked) => toggleType(type, 'push', checked)}
                            disabled={!canUsePush}
                            id={`${type}-push`}
                          />
                          <Label htmlFor={`${type}-push`} className={cn('text-sm', !canUsePush && 'text-muted-foreground')}>
                            Push
                          </Label>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bottom Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          size="lg"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSaving ? 'Wird gespeichert...' : 'Änderungen speichern'}
        </Button>
      </div>
    </div>
  )
}
