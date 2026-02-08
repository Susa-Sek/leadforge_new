'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Trophy, XCircle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { CLOSE_REASONS } from '@/lib/crm/schemas';

interface WonLostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { is_won: boolean; close_reason?: string; actual_close_date?: string }) => void;
  dealTitle: string;
}

export function WonLostDialog({
  open,
  onOpenChange,
  onConfirm,
  dealTitle,
}: WonLostDialogProps) {
  const [result, setResult] = useState<'won' | 'lost'>('won');
  const [closeReason, setCloseReason] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [actualCloseDate, setActualCloseDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleConfirm = () => {
    const fullReason = closeNotes
      ? `${closeReason}${closeNotes ? ` - ${closeNotes}` : ''}`
      : closeReason;

    onConfirm({
      is_won: result === 'won',
      close_reason: result === 'lost' ? fullReason : undefined,
      actual_close_date: actualCloseDate,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deal abschließen</DialogTitle>
          <DialogDescription>
            &quot;{dealTitle}&quot; als gewonnen oder verloren markieren.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup
            value={result}
            onValueChange={(val) => setResult(val as 'won' | 'lost')}
            className="grid grid-cols-2 gap-4"
          >
            <div>
              <RadioGroupItem value="won" id="won" className="peer sr-only" />
              <Label
                htmlFor="won"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 [&:has([data-state=checked])]:border-green-500"
              >
                <Trophy className="mb-3 h-6 w-6 text-green-600" />
                <span className="font-semibold text-green-700">Gewonnen</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="lost" id="lost" className="peer sr-only" />
              <Label
                htmlFor="lost"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50 [&:has([data-state=checked])]:border-red-500"
              >
                <XCircle className="mb-3 h-6 w-6 text-red-600" />
                <span className="font-semibold text-red-700">Verloren</span>
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="closeDate">Tatsächliches Closing-Datum</Label>
            <Input
              id="closeDate"
              type="date"
              value={actualCloseDate}
              onChange={(e) => setActualCloseDate(e.target.value)}
            />
          </div>

          {result === 'lost' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="reason">Grund</Label>
                <Select value={closeReason} onValueChange={setCloseReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Grund auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLOSE_REASONS.map((reason) => (
                      <SelectItem key={reason.value} value={reason.value}>
                        {reason.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notizen (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Details zum Verlust..."
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleConfirm}>
            {result === 'won' ? 'Als gewonnen markieren' : 'Als verloren markieren'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
