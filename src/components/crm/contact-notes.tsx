'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Textarea } from '@/components/ui/textarea';
import { useUpdateContactNotes } from '@/hooks/use-crm';

interface ContactNotesProps {
  contactId: string;
  initialNotes: string;
}

export function ContactNotes({ contactId, initialNotes }: ContactNotesProps) {
  const [notes, setNotes] = useState(initialNotes || '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const { trigger: updateNotes } = useUpdateContactNotes(contactId);

  // Debounced save
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (notes !== initialNotes) {
        setSaveStatus('saving');
        try {
          await updateNotes(notes as any);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
          setSaveStatus('idle');
          toast.error('Fehler beim Speichern');
        }
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [notes, initialNotes, updateNotes]);

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Notizen zu diesem Kontakt..."
        className="min-h-[150px]"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <div className="flex justify-end">
        <span className="text-xs text-muted-foreground">
          {saveStatus === 'saving'
            ? 'Speichern...'
            : saveStatus === 'saved'
            ? 'Gespeichert'
            : `${notes.length} Zeichen`}
        </span>
      </div>
    </div>
  );
}
