'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Mail,
  Phone,
  Users,
  FileText,
  CheckSquare,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

import { useInteractions, useCreateInteraction, useDeleteInteraction } from '@/hooks/use-crm';
import { interactionSchema, type InteractionFormData, defaultInteractionValues } from '@/lib/crm/schemas';
import { INTERACTION_TYPE_LABELS, type InteractionType } from '@/lib/crm/types';

const ICONS: Record<InteractionType, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  note: <FileText className="h-4 w-4" />,
  task: <CheckSquare className="h-4 w-4" />,
};

const COLORS: Record<InteractionType, string> = {
  email: 'bg-blue-100 text-blue-700',
  call: 'bg-green-100 text-green-700',
  meeting: 'bg-purple-100 text-purple-700',
  note: 'bg-yellow-100 text-yellow-700',
  task: 'bg-orange-100 text-orange-700',
};

interface InteractionTimelineProps {
  contactId: string;
}

export function InteractionTimeline({ contactId }: InteractionTimelineProps) {
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [interactionToDelete, setInteractionToDelete] = useState<string | null>(null);

  const { interactions, isLoading, mutate } = useInteractions(contactId);
  const { trigger: createInteraction, isMutating: isCreating } = useCreateInteraction(contactId);
  const { trigger: deleteInteraction, isMutating: isDeleting } = useDeleteInteraction(contactId);

  const form = useForm<InteractionFormData>({
    resolver: zodResolver(interactionSchema),
    defaultValues: defaultInteractionValues,
  });

  const onSubmit = async (data: InteractionFormData) => {
    try {
      await createInteraction(data as any);
      toast.success('Interaktion hinzugefügt');
      form.reset(defaultInteractionValues);
      setShowForm(false);
      mutate();
    } catch (error) {
      toast.error('Fehler beim Hinzufügen');
    }
  };

  const handleDelete = async () => {
    if (!interactionToDelete) return;
    try {
      await deleteInteraction(interactionToDelete as any);
      toast.success('Interaktion gelöscht');
      mutate();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    } finally {
      setDeleteConfirmOpen(false);
      setInteractionToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setInteractionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const groupedInteractions = interactions.reduce((acc, interaction) => {
    const date = format(new Date(interaction.created_at), 'MMMM yyyy', { locale: de });
    if (!acc[date]) acc[date] = [];
    acc[date].push(interaction);
    return acc;
  }, {} as Record<string, typeof interactions>);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Interaktions-History</CardTitle>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" />
          {showForm ? 'Abbrechen' : 'Hinzufügen'}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {showForm && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 bg-muted rounded-lg">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Typ</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Typ auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(INTERACTION_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              {ICONS[value as InteractionType]}
                              {label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notizen</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Details zur Interaktion..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Speichern
                </Button>
              </div>
            </form>
          </Form>
        )}

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : interactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Noch keine Interaktionen</p>
              <p className="text-sm">Füge Notizen, E-Mails, Anrufe und Meetings hinzu.</p>
            </div>
          ) : (
            <div className="relative pl-4">
              <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-6">
                {Object.entries(groupedInteractions).map(([month, items]) => (
                  <div key={month}>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-card py-1 z-10">
                      {month}
                    </h4>
                    <div className="space-y-4">
                      {items.map((interaction) => (
                        <div key={interaction.id} className="relative">
                          <div className="absolute -left-4 top-0 w-2 h-2 rounded-full bg-border ring-4 ring-card" />
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="secondary"
                                  className={COLORS[interaction.type]}
                                >
                                  <span className="flex items-center gap-1">
                                    {ICONS[interaction.type]}
                                    {INTERACTION_TYPE_LABELS[interaction.type]}
                                  </span>
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(interaction.created_at), 'dd. MMM', { locale: de })}
                                </span>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => confirmDelete(interaction.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            {interaction.notes && (
                              <p className="mt-2 text-sm whitespace-pre-wrap">{interaction.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Interaktion löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Interaktion wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
