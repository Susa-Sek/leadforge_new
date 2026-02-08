// Security Settings Page - Epic E13
// Route: /dashboard/einstellungen/sicherheit

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Shield, Lock, Smartphone, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import { useSecuritySettings, useChangePassword } from '@/hooks/use-settings';

// Password validation schema
const passwordSchema = z.object({
  current_password: z.string().min(1, 'Aktuelles Passwort ist erforderlich'),
  new_password: z.string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .regex(/[A-Z]/, 'Passwort muss mindestens einen Großbuchstaben enthalten')
    .regex(/[a-z]/, 'Passwort muss mindestens einen Kleinbuchstaben enthalten')
    .regex(/[0-9]/, 'Passwort muss mindestens eine Zahl enthalten'),
  confirm_password: z.string().min(1, 'Passwort-Bestätigung ist erforderlich'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirm_password'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

function PasswordStrengthIndicator({ password }: { password: string }) {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const strength = Object.values(checks).filter(Boolean).length;
  const progress = (strength / 4) * 100;

  const getColor = () => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 2) return 'bg-yellow-500';
    if (strength <= 3) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2 mt-2">
      <Progress value={progress} className={`h-1 ${getColor()}`} />
      <div className="space-y-1 text-sm">
        <div className="flex items-center gap-2">
          {checks.length ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
          <span className={checks.length ? 'text-green-600' : 'text-muted-foreground'}>
            Mindestens 8 Zeichen
          </span>
        </div>
        <div className="flex items-center gap-2">
          {checks.uppercase ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
          <span className={checks.uppercase ? 'text-green-600' : 'text-muted-foreground'}>
            Großbuchstaben (A-Z)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {checks.lowercase ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
          <span className={checks.lowercase ? 'text-green-600' : 'text-muted-foreground'}>
            Kleinbuchstaben (a-z)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {checks.number ? <Check className="h-3 w-3 text-green-500" /> : <X className="h-3 w-3 text-red-500" />}
          <span className={checks.number ? 'text-green-600' : 'text-muted-foreground'}>
            Mindestens eine Zahl (0-9)
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SecuritySettingsPage() {
  const { security, isLoading } = useSecuritySettings();
  const { trigger: changePassword, isMutating } = useChangePassword();

  const form = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  const watchNewPassword = form.watch('new_password');

  const onSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success('Passwort erfolgreich geändert');
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Ändern des Passworts');
    }
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
        <h1 className="text-2xl font-bold tracking-tight">Sicherheits-Einstellungen</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre Sicherheitseinstellungen und Passwörter
        </p>
      </div>

      <Separator />

      {/* Password Change Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Passwort ändern</CardTitle>
              <CardDescription>
                Ändern Sie Ihr Passwort für mehr Sicherheit
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
              <FormField
                control={form.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aktuelles Passwort</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neues Passwort</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <PasswordStrengthIndicator password={watchNewPassword} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Neues Passwort bestätigen</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button type="submit" disabled={isMutating}>
                  {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Passwort ändern
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 2FA Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle>Zwei-Faktor-Authentifizierung</CardTitle>
                <Badge variant={security?.two_factor_enabled ? 'default' : 'secondary'}>
                  {security?.two_factor_enabled ? 'Aktiviert' : 'Nicht aktiviert'}
                </Badge>
              </div>
              <CardDescription>
                Erhöhen Sie die Sicherheit Ihres Kontos mit 2FA
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {security?.two_factor_enabled ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                2FA ist derzeit aktiviert. Sie benötigen einen Code von Ihrer Authenticator-App beim Login.
              </p>
              <Button variant="outline" disabled>
                2FA deaktivieren (demnächst verfügbar)
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Schützen Sie Ihr Konto zusätzlich mit einem zweiten Faktor.
                Bei der Anmeldung benötigen Sie neben Ihrem Passwort einen Code von einer Authenticator-App.
              </p>
              <Button disabled>
                2FA aktivieren (demnächst verfügbar)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
