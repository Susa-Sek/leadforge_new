/**
 * Save Template Dialog Component
 *
 * Dialog for saving current export configuration as a template.
 *
 * @module SaveTemplateDialog
 */

'use client';

import { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { PlanTier } from '@/components/search/plan-gate';
import type { ExportType, ExportFormat } from '@/lib/export/types';
import { EXPORT_LIMITS, FEATURE_ACCESS } from '@/lib/export/types';
import { useExportTemplates } from '@/hooks/use-export';
import { toast } from 'sonner';

interface SaveTemplateDialogProps {
  /** Dialog open state */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Export type */
  exportType: ExportType;
  /** Export format */
  format: ExportFormat;
  /** Selected columns */
  columns: string[];
  /** User's plan tier */
  planTier: PlanTier;
}

/**
 * SaveTemplateDialog Component
 *
 * Dialog for saving export configuration as template.
 */
export function SaveTemplateDialog({
  isOpen,
  onClose,
  exportType,
  format,
  columns,
  planTier,
}: SaveTemplateDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { templates, createTemplate } = useExportTemplates();

  const maxTemplates = EXPORT_LIMITS[planTier].maxTemplates;
  const currentCount = templates.length;
  const isAtLimit = maxTemplates !== Infinity && currentCount >= maxTemplates;
  const canShare = FEATURE_ACCESS[planTier].templateSharing;

  const handleSave = async () => {
    if (!name.trim() || columns.length === 0 || isAtLimit) return;

    setIsSaving(true);

    try {
      await createTemplate({
        name: name.trim(),
        description: description.trim() || undefined,
        exportType,
        format,
        columns,
        isPublic: canShare ? isPublic : false,
      });

      toast.success('Template gespeichert', {
        description: `„${name}" wurde erfolgreich gespeichert.`,
      });

      setName('');
      setDescription('');
      setIsPublic(false);
      onClose();
    } catch (error) {
      toast.error('Fehler beim Speichern', {
        description:
          error instanceof Error
            ? error.message
            : 'Das Template konnte nicht gespeichert werden.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getExportTypeLabel = () => {
    switch (exportType) {
      case 'contacts':
        return 'Kontakte';
      case 'deals':
        return 'Deals';
      case 'leads':
        return 'Leads';
      default:
        return 'Daten';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Als Template speichern
          </DialogTitle>
          <DialogDescription>
            Speichere diese Export-Konfiguration für spätere Verwendung.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Template Limit Info */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Templates:</span>
            <span>
              {currentCount} von{' '}
              {maxTemplates === Infinity ? 'unbegrenzt' : maxTemplates}{' '}
              verwendet
            </span>
          </div>

          {isAtLimit && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <p className="font-medium">Template-Limit erreicht</p>
              <p>
                Du hast das Maximum von {maxTemplates} Templates erreicht.
                Lösche ein bestehendes Template oder upgrade auf Enterprise für
                unbegrenzte Templates.
              </p>
            </div>
          )}

          {/* Template Info */}
          <div className="rounded-md bg-muted p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Typ:</span>
              <span>{getExportTypeLabel()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Format:</span>
              <span>{format.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Spalten:</span>
              <span>{columns.length}</span>
            </div>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="template-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Basis-Export"
              maxLength={100}
              disabled={isAtLimit}
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="template-description">Beschreibung (optional)</Label>
            <Textarea
              id="template-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibung des Templates..."
              maxLength={500}
              rows={2}
              disabled={isAtLimit}
            />
          </div>

          {/* Public/Team Sharing */}
          {canShare && (
            <div className="flex items-center justify-between space-y-0">
              <div className="space-y-0.5">
                <Label htmlFor="template-public">Öffentlich (Team)</Label>
                <p className="text-xs text-muted-foreground">
                  Anderen Team-Mitgliedern dieses Template anzeigen
                </p>
              </div>
              <Switch
                id="template-public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Abbrechen
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !name.trim() ||
              columns.length === 0 ||
              isAtLimit ||
              isSaving
            }
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird gespeichert...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Speichern
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SaveTemplateDialog;
