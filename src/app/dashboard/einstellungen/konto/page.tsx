// Account Settings Page - Epic E13
// Route: /dashboard/einstellungen/konto

'use client';

import { Loader2, Globe, Calendar, DollarSign, Languages } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import { useAccountSettings, useUpdateAccountSettings } from '@/hooks/use-settings';

const LANGUAGES = [
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'en', label: 'English', flag: '🇬🇧' },
];

const TIMEZONES = [
  { value: 'Europe/Berlin', label: 'Berlin (GMT+1)' },
  { value: 'Europe/Vienna', label: 'Wien (GMT+1)' },
  { value: 'Europe/Zurich', label: 'Zürich (GMT+1)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
  { value: 'Asia/Tokyo', label: 'Tokio (GMT+9)' },
  { value: 'Asia/Singapore', label: 'Singapur (GMT+8)' },
];

const DATE_FORMATS = [
  { value: 'DD.MM.YYYY', label: '31.12.2024 (Deutsch)' },
  { value: 'YYYY-MM-DD', label: '2024-12-31 (ISO)' },
  { value: 'MM/DD/YYYY', label: '12/31/2024 (US)' },
];

const CURRENCIES = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
];

export default function AccountSettingsPage() {
  const { account, isLoading } = useAccountSettings();
  const { trigger: updateSettings, isMutating } = useUpdateAccountSettings();

  const handleSettingChange = async (key: string, value: string) => {
    try {
      await updateSettings({ [key]: value });
      toast.success('Einstellung gespeichert');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const settings = account?.settings || {
    language: 'de',
    timezone: 'Europe/Berlin',
    date_format: 'DD.MM.YYYY',
    currency: 'EUR',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Konto-Einstellungen</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre regionalen Einstellungen
        </p>
      </div>

      <Separator />

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Regionale Einstellungen</CardTitle>
              <CardDescription>
                Passen Sie Sprache, Zeitzone und Datumsformat an
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Sprache</p>
                <p className="text-sm text-muted-foreground">
                  Wählen Sie Ihre bevorzugte Sprache
                </p>
              </div>
            </div>
            <Select
              value={settings.language}
              onValueChange={(value) => handleSettingChange('language', value)}
              disabled={isMutating}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <span className="mr-2">{lang.flag}</span>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Timezone */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Zeitzone</p>
                <p className="text-sm text-muted-foreground">
                  Wählen Sie Ihre Zeitzone für Datumsanzeigen
                </p>
              </div>
            </div>
            <Select
              value={settings.timezone}
              onValueChange={(value) => handleSettingChange('timezone', value)}
              disabled={isMutating}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Date Format */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Datumsformat</p>
                <p className="text-sm text-muted-foreground">
                  Wählen Sie Ihr bevorzugtes Datumsformat
                </p>
              </div>
            </div>
            <Select
              value={settings.date_format}
              onValueChange={(value) => handleSettingChange('date_format', value)}
              disabled={isMutating}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Currency */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Währung</p>
                <p className="text-sm text-muted-foreground">
                  Wählen Sie Ihre bevorzugte Währung
                </p>
              </div>
            </div>
            <Select
              value={settings.currency}
              onValueChange={(value) => handleSettingChange('currency', value)}
              disabled={isMutating}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.value} value={curr.value}>
                    {curr.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Account-Informationen</CardTitle>
          <CardDescription>
            Übersicht über Ihre Kontodaten
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">E-Mail</p>
              <p className="font-medium">{account?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Registriert am</p>
              <p className="font-medium">
                {account?.created_at
                  ? new Date(account.created_at).toLocaleDateString('de-DE')
                  : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aktueller Plan</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {account?.plan_tier || 'Free'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="pt-2">
            <Button variant="outline" asChild>
              <a href="/dashboard/einstellungen/abonnement">
                Plan verwalten
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
