'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { useCreateContact, useUpdateContact } from '@/hooks/use-crm';
import { contactSchema, type ContactFormData, defaultContactValues } from '@/lib/crm/schemas';
import { TagInput } from './tag-input';
import type { Contact, ContactTag } from '@/lib/crm/types';

interface ContactFormProps {
  contact?: Contact;
  mode: 'create' | 'edit';
}

export function ContactForm({ contact, mode }: ContactFormProps) {
  const router = useRouter();
  const { trigger: createContact, isMutating: isCreating } = useCreateContact();
  const { trigger: updateContact, isMutating: isUpdating } = useUpdateContact(contact?.id || '');

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: defaultContactValues,
  });

  // Set initial values when editing
  useEffect(() => {
    if (contact && mode === 'edit') {
      form.reset({
        name: contact.name,
        company: contact.company,
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        website: contact.website || '',
        tag_ids: contact.tags?.map((t) => t.id) || [],
      });
    }
  }, [contact, mode, form]);

  const onSubmit = async (data: ContactFormData) => {
    try {
      const tagIds = form.watch('tag_ids') || [];

      if (mode === 'create') {
        const newContact = await createContact({
          ...data,
          tag_ids: tagIds,
        } as any);
        toast.success('Kontakt erstellt');
        router.push(`/dashboard/kontakte/${(newContact as Contact).id}`);
      } else if (contact) {
        await updateContact({
          ...data,
        } as any);
        toast.success('Kontakt aktualisiert');
        router.push(`/dashboard/kontakte/${contact.id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
    }
  };

  const selectedTags = form.watch('tag_ids')?.map((id) => {
    // Find tag by id - in real implementation this would come from API
    return {
      id,
      user_id: '',
      name: 'Tag', // Placeholder
      color: '#3B82F6',
      created_at: '',
    } as ContactTag;
  }) || [];

  const isSubmitting = isCreating || isUpdating;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Neuer Kontakt' : 'Kontakt bearbeiten'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Required Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Pflichtfelder</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Max Mustermann" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Firma *</FormLabel>
                      <FormControl>
                        <Input placeholder="Muster GmbH" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Kontaktdaten</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="max@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input placeholder="+49 123 456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input placeholder="Musterstraße 1, 12345 Berlin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
              <FormField
                control={form.control}
                name="tag_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <TagInput
                        selectedTags={selectedTags}
                        onChange={(tags) => field.onChange(tags.map((t) => t.id))}
                        maxTags={20}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Kontakt erstellen' : 'Speichern'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
