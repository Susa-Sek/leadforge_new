// Notification Settings Page - Epic E13
// Route: /dashboard/einstellungen/benachrichtigungen

'use client';

import { Loader2, Bell, Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Placeholder notification types until E10 integration
const notificationTypes = [
  {
    id: 'search_completed',
    title: 'Suche abgeschlossen',
    description: 'Erhalten Sie eine Benachrichtigung, wenn eine Suche fertiggestellt ist',
    defaultEnabled: true,
  },
  {
    id: 'export_ready',
    title: 'Export fertiggestellt',
    description: 'Benachrichtigung, wenn ein Datenexport zum Download bereitsteht',
    defaultEnabled: true,
  },
  {
    id: 'deal_status',
    title: 'Deal-Status geändert',
    description: 'Benachrichtigung bei Änderungen an Ihren Deals im CRM',
    defaultEnabled: true,
  },
  {
    id: 'low_credits',
    title: 'Credits niedrig',
    description: 'Warnung, wenn Ihr Credits-Guthaben unter 10 fällt',
    defaultEnabled: true,
  },
  {
    id: 'system_updates',
    title: 'System-Updates',
    description: 'Informationen über neue Funktionen und Wartungsarbeiten',
    defaultEnabled: false,
  },
];

export default function NotificationSettingsPage() {
  // Placeholder - this would connect to E10 notification preferences API
  const isLoading = false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Benachrichtigungs-Einstellungen</h1>
        <p className="text-muted-foreground">
          Steuern Sie, welche Benachrichtigungen Sie erhalten möchten
        </p>
      </div>

      <Separator />

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>In-App Benachrichtigungen</CardTitle>
              <CardDescription>
                Benachrichtigungen, die in der App angezeigt werden
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {notificationTypes.map((type) => (
            <div key={type.id} className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor={type.id} className="font-medium">
                    {type.title}
                  </Label>
                  {type.defaultEnabled && (
                    <Badge variant="secondary" className="text-xs">Empfohlen</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{type.description}</p>
              </div>
              <Switch
                id={type.id}
                defaultChecked={type.defaultEnabled}
                onCheckedChange={() => {
                  toast.info('Benachrichtigungseinstellungen werden mit E10 integriert');
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>E-Mail Benachrichtigungen</CardTitle>
              <CardDescription>
                Erhalten Sie wichtige Updates auch per E-Mail
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_critical" className="font-medium">
                Kritische Benachrichtigungen
              </Label>
              <p className="text-sm text-muted-foreground">
                Sicherheitswarnungen und wichtige Account-Updates
              </p>
            </div>
            <Switch
              id="email_critical"
              defaultChecked={true}
              disabled
            />
          </div>
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email_marketing" className="font-medium">
                Newsletter und Updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Produktneuigkeiten, Tipps und Angebote (max. 1x/Monat)
              </p>
            </div>
            <Switch
              id="email_marketing"
              defaultChecked={false}
              onCheckedChange={() => {
                toast.info('E-Mail-Einstellungen werden mit E10 integriert');
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Browser Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Browser-Benachrichtigungen</CardTitle>
              <CardDescription>
                Push-Benachrichtigungen in Ihrem Browser
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="browser_notifications" className="font-medium">
                Browser-Push aktivieren
              </Label>
              <p className="text-sm text-muted-foreground">
                Erhalten Sie Benachrichtigungen auch, wenn die App nicht geöffnet ist
              </p>
            </div>
            <Switch
              id="browser_notifications"
              defaultChecked={false}
              onCheckedChange={() => {
                toast.info('Browser-Benachrichtigungen werden mit E10 integriert');
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
