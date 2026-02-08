'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2, Euro, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';

import { useCreateDeal, useUpdateDeal, useDealStages, useContacts } from '@/hooks/use-crm';
import { dealSchema, type DealFormData, defaultDealValues, STAGE_DEFAULT_PROBABILITIES } from '@/lib/crm/schemas';
import type { Deal } from '@/lib/crm/types';

interface DealFormProps {
  deal?: Deal;
  mode: 'create' | 'edit';
  initialStageId?: string;
}

export function DealForm({ deal, mode, initialStageId }: DealFormProps) {
  const router = useRouter();
  const { trigger: createDeal, isMutating: isCreating } = useCreateDeal();
  const { trigger: updateDeal, isMutating: isUpdating } = useUpdateDeal(deal?.id || '');
  const { stages, isLoading: isLoadingStages } = useDealStages();
  const { contacts: contactsList, isLoading: isLoadingContacts } = useContacts({ limit: 500 });

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: defaultDealValues,
  });

  // Set initial values
  useEffect(() => {
    if (deal && mode === 'edit') {
      form.reset({
        title: deal.title,
        description: deal.description || '',
        contact_id: deal.contact_id || null,
        stage_id: deal.stage_id,
        value: deal.value,
        probability: deal.probability,
        expected_close_date: deal.expected_close_date
          ? format(new Date(deal.expected_close_date), 'yyyy-MM-dd')
          : null,
      });
    } else if (initialStageId) {
      form.setValue('stage_id', initialStageId);
      // Set default probability based on stage
      const stage = stages.find((s) => s.id === initialStageId);
      if (stage) {
        const defaultProb = STAGE_DEFAULT_PROBABILITIES[stage.name];
        if (defaultProb !== undefined) {
          form.setValue('probability', defaultProb);
        }
      }
    }
  }, [deal, mode, initialStageId, form, stages]);

  // Update probability when stage changes
  const handleStageChange = (stageId: string) => {
    form.setValue('stage_id', stageId);
    const stage = stages.find((s) => s.id === stageId);
    if (stage) {
      const defaultProb = STAGE_DEFAULT_PROBABILITIES[stage.name];
      if (defaultProb !== undefined) {
        form.setValue('probability', defaultProb);
      }
    }
  };

  const onSubmit = async (data: DealFormData) => {
    try {
      const payload = {
        ...data,
        value: data.value === undefined ? null : data.value,
        probability: data.probability === undefined ? null : data.probability,
        expected_close_date: data.expected_close_date || null,
      };

      if (mode === 'create') {
        const newDeal = await createDeal(payload as any);
        toast.success('Deal erstellt');
        router.push(`/dashboard/deals/${(newDeal as Deal).id}`);
      } else if (deal) {
        await updateDeal(payload as any);
        toast.success('Deal aktualisiert');
        router.push(`/dashboard/deals/${deal.id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
    }
  };

  const isSubmitting = isCreating || isUpdating;
  const probability = form.watch('probability') || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Neuer Deal' : 'Deal bearbeiten'}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {/* Required Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Pflichtfelder</h3>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titel *</FormLabel>
                    <FormControl>
                      <Input placeholder="Projekt X - Implementierung" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stage_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage *</FormLabel>
                    <Select
                      onValueChange={handleStageChange}
                      value={field.value}
                      disabled={isLoadingStages}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Stage auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: stage.color }}
                              />
                              {stage.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Optional Fields */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Details</h3>

              <FormField
                control={form.control}
                name="contact_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kontakt</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val || null)}
                      value={field.value || 'none'}
                      disabled={isLoadingContacts}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kontakt auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Kein Kontakt</SelectItem>
                        {contactsList.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            {contact.name} ({contact.company})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wert (EUR)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min={0}
                            placeholder="50000"
                            className="pl-10"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              field.onChange(val === '' ? null : Number(val));
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expected_close_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Erwartetes Closing</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="probability"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span>Wahrscheinlichkeit</span>
                      <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                        <Percent className="h-3 w-3" />
                        {field.value || 0}%
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[field.value || 0]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschreibung</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Details zum Deal..."
                        className="min-h-[100px]"
                        {...field}
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
              {mode === 'create' ? 'Deal erstellen' : 'Speichern'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
