// Notification Settings Page - Epic E13 / E10 Integration
// Route: /dashboard/einstellungen/benachrichtigungen

'use client';

import { useState, useEffect } from 'react';
import { Loader2, Bell, Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Notification type mapping between UI and API
const notificationTypes = [
  { id: 'search_completed', label: 'Suche abgeschlossen', category: 'app' as const },
  { id: 'export_ready', label: 'Export fertiggestellt', category: 'app' as const },
  { id: 'deal_status', label: 'Deal-Status geändert', category: 'app' as const },
  { id: 'low_credits', label: 'Credits niedrig', category: 'app' as const, recommended: true },
  { id: 'system_updates', label: 'System-Updates', category: 'app' as const },
];

interface NotificationPreferences {
  [key: string]: boolean;
}

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [emailCritical, setEmailCritical] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [browserNotifications, setBrowserNotifications] = useState(false);

  // Load preferences from E10 API
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch('/api/notifications/preferences');
        if (!response.ok) throw new Error('Failed to load preferences');

        const data = await response.json();

        // Transform API response to local state
        const prefs: NotificationPreferences = {};
        data.preferences?.forEach((p: any) => {
          if (notificationTypes.some(nt => nt.id === p.notification_type)) {
            prefs[p.notification_type] = p.in_app_enabled;
          }
        });

        setPreferences(prefs);

        // Set email preferences if available
        const criticalPref = data.preferences?.find((p: any) => p.notification_type === 'low_credits');
        if (criticalPref) {
          setEmailCritical(criticalPref.email_enabled);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        toast.error('Fehler beim Laden der Einstellungen');

        // Set defaults on error
        const defaults: NotificationPreferences = {};
        notificationTypes.forEach(nt => {
          defaults[nt.id] = true;
        });
        setPreferences(defaults);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Save preference to E10 API
  const savePreference = async (type: string, enabled: boolean, channel: 'in_app' | 'email' = 'in_app') => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_type: type,
          [channel === 'in_app' ? 'in_app_enabled' : 'email_enabled']: enabled,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast.success('Einstellung gespeichert');
    } catch (error) {
      console.error('Error saving preference:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (type: string, enabled: boolean) => {
    setPreferences(prev => ({ ...prev, [type]: enabled }));
    savePreference(type, enabled, 'in_app');
  };

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
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Speichern...
            </div>
          )}
          {notificationTypes.map((type) => (
            <div key={type.id} className="flex items-start justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Label htmlFor={type.id} className="font-medium">
                    {type.label}
                  </Label>
                  {type.recommended && (
                    <Badge variant="secondary" className="text-xs">Empfohlen</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {type.id === 'search_completed' && 'Erhalten Sie eine Benachrichtigung, wenn eine Suche fertiggestellt ist'}
                  {type.id === 'export_ready' && 'Benachrichtigung, wenn ein Datenexport zum Download bereitsteht'}
                  {type.id === 'deal_status' && 'Benachrichtigung bei Änderungen an Ihren Deals im CRM'}
                  {type.id === 'low_credits' && 'Warnung, wenn Ihr Credits-Guthaben unter 10 fällt'}
                  {type.id === 'system_updates' && 'Informationen über neue Funktionen und Wartungsarbeiten'}
                </p>
              </div>
              <Switch
                id={type.id}
                checked={preferences[type.id] ?? true}
                onCheckedChange={(checked) => handleToggle(type.id, checked)}
                disabled={isSaving}
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
              checked={emailCritical}
              onCheckedChange={(checked) => {
                setEmailCritical(checked);
                savePreference('low_credits', checked, 'email');
              }}
              disabled={isSaving}
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
              checked={emailMarketing}
              onCheckedChange={setEmailMarketing}
              disabled={isSaving}
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
              checked={browserNotifications}
              onCheckedChange={setBrowserNotifications}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
