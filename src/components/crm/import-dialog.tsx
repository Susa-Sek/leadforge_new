'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

import { useImportContacts, useTags, useContacts } from '@/hooks/use-crm';
import { importSchema, type ImportFormData } from '@/lib/crm/schemas';
import type { SearchResultLead } from '@/lib/search/types';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionId: string;
  leads: SearchResultLead[];
  onSuccess?: () => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  collectionId,
  leads,
  onSuccess,
}: ImportDialogProps) {
  const { tags } = useTags();
  const { trigger: importContacts, isMutating: isImporting } = useImportContacts();
  const { contacts } = useContacts({ limit: 1000 });

  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [existingEmails, setExistingEmails] = useState<Set<string>>(new Set());

  const form = useForm<ImportFormData>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      collection_id: collectionId,
      lead_ids: [],
      tag_ids: [],
    },
  });

  // Load existing contact emails for duplicate detection
  useEffect(() => {
    const emails = new Set(
      contacts.map((c) => c.email?.toLowerCase()).filter((e): e is string => typeof e === 'string')
    );
    setExistingEmails(emails);
  }, [contacts]);

  // Update form when selection changes
  useEffect(() => {
    form.setValue('lead_ids', selectedLeads);
  }, [selectedLeads, form]);

  const toggleLead = (leadId: string) => {
    setSelectedLeads((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    );
  };

  const selectAll = () => {
    const available = leads
      .filter((lead) => !isDuplicate(lead))
      .map((lead) => lead.id);
    setSelectedLeads(available);
  };

  const deselectAll = () => {
    setSelectedLeads([]);
  };

  const isDuplicate = (lead: SearchResultLead): boolean => {
    if (!lead.email) return false;
    return existingEmails.has(lead.email.toLowerCase());
  };

  const onSubmit = async (data: ImportFormData) => {
    try {
      const result = await importContacts({
        collection_id: data.collection_id,
        lead_ids: selectedLeads,
        tag_ids: data.tag_ids || [],
      } as any);

      toast.success(`${result.imported} Kontakte importiert`);
      if (result.duplicates > 0) {
        toast.info(`${result.duplicates} Duplikate übersprungen`);
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Import fehlgeschlagen');
    }
  };

  const duplicateCount = leads.filter(isDuplicate).length;
  const availableCount = leads.length - duplicateCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Leads importieren
          </DialogTitle>
          <DialogDescription>
            Wähle die Leads aus, die du als Kontakte importieren möchtest.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 flex flex-col">
            <div className="space-y-4 py-4">
              {duplicateCount > 0 && (
                <Alert variant="default" className="bg-yellow-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {duplicateCount} Lead(s) haben bereits eine E-Mail-Adresse, die in deinen
                    Kontakten existiert.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedLeads.length} von {availableCount} ausgewählt
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
                    Alle auswählen
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={deselectAll}>
                    Auswahl aufheben
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[300px] border rounded-md p-2">
                <div className="space-y-2">
                  {leads.map((lead) => {
                    const duplicate = isDuplicate(lead);
                    return (
                      <div
                        key={lead.id}
                        className={`flex items-start gap-3 p-2 rounded-lg border ${
                          duplicate
                            ? 'bg-muted/50 opacity-60'
                            : selectedLeads.includes(lead.id)
                            ? 'bg-primary/5 border-primary'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={() => toggleLead(lead.id)}
                          disabled={duplicate}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{lead.companyName}</span>
                            {duplicate && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                Bereits vorhanden
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {lead.address || lead.email || '-'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <Separator />

              <FormField
                control={form.control}
                name="tag_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags zuweisen (optional)</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant={field.value?.includes(tag.id) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            style={
                              field.value?.includes(tag.id)
                                ? { backgroundColor: tag.color, color: '#fff' }
                                : undefined
                            }
                            onClick={() => {
                              const current = field.value || [];
                              const updated = current.includes(tag.id)
                                ? current.filter((id) => id !== tag.id)
                                : [...current, tag.id];
                              field.onChange(updated);
                            }}
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {tags.length === 0 && (
                          <span className="text-sm text-muted-foreground">
                            Noch keine Tags erstellt
                          </span>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="border-t pt-4">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isImporting || selectedLeads.length === 0}>
                {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedLeads.length > 0
                  ? `${selectedLeads.length} Kontakte importieren`
                  : 'Importieren'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
