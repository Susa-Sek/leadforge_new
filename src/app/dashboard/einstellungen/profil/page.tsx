// Profile Settings Page - Epic E13
// Route: /dashboard/einstellungen/profil

'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, Loader2, User } from 'lucide-react';
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
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/use-settings';

// Validation schema
const profileSchema = z.object({
  first_name: z.string().min(2, 'Vorname muss mindestens 2 Zeichen lang sein').max(100),
  last_name: z.string().min(2, 'Nachname muss mindestens 2 Zeichen lang sein').max(100),
  company_name: z.string().max(200).optional(),
  job_title: z.string().max(100).optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
  const { profile, isLoading: isLoadingProfile, mutate } = useProfile();
  const { trigger: updateProfile, isMutating: isUpdating } = useUpdateProfile();
  const { trigger: uploadAvatar, isMutating: isUploading } = useUploadAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      company_name: '',
      job_title: '',
    },
  });

  // Update form values when profile loads
  if (profile && form.getValues().first_name === '' && profile.first_name) {
    form.reset({
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      company_name: profile.company_name || '',
      job_title: profile.job_title || '',
    });
  }

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      toast.success('Profil erfolgreich aktualisiert');
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Aktualisieren');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Nur JPG und PNG Dateien erlaubt');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Datei zu groß (max. 2MB)');
      return;
    }

    try {
      await uploadAvatar(file);
      toast.success('Avatar erfolgreich hochgeladen');
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Hochladen');
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isSubmitting = isUpdating || isUploading;

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const initials = profile?.first_name?.[0] && profile?.last_name?.[0]
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : profile?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profil-Einstellungen</h1>
        <p className="text-muted-foreground">
          Verwalten Sie Ihre persönlichen Informationen
        </p>
      </div>

      <Separator />

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profilbild</CardTitle>
          <CardDescription>
            Laden Sie ein Profilbild hoch (max. 2MB, JPG oder PNG)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24 cursor-pointer" onClick={handleAvatarClick}>
                <AvatarImage src={profile?.avatar_url || ''} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
            <div>
              <p className="font-medium">{profile?.first_name} {profile?.last_name}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Persönliche Informationen</CardTitle>
          <CardDescription>
            Aktualisieren Sie Ihre persönlichen Daten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vorname *</FormLabel>
                      <FormControl>
                        <Input placeholder="Max" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nachname *</FormLabel>
                      <FormControl>
                        <Input placeholder="Mustermann" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-4">
                  Unternehmen
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Firmenname</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Muster GmbH"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="job_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position/Jobtitel</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Geschäftsführer"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset({
                      first_name: profile?.first_name || '',
                      last_name: profile?.last_name || '',
                      company_name: profile?.company_name || '',
                      job_title: profile?.job_title || '',
                    });
                  }}
                  disabled={isSubmitting}
                >
                  Zurücksetzen
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Speichern
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
