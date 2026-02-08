/**
 * Template Manager Component
 *
 * UI for managing export templates - list, edit, delete, duplicate.
 *
 * @module TemplateManager
 */

'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  FileSpreadsheet,
  MoreHorizontal,
  Copy,
  Pencil,
  Trash2,
  Loader2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import type { TemplateResponse, ExportType } from '@/lib/export/types';
import { EXPORT_LIMITS, formatDate } from '@/lib/export/types';
import { useExportTemplates } from '@/hooks/use-export';
import type { PlanTier } from '@/components/search/plan-gate';
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
import { toast } from 'sonner';

interface TemplateManagerProps {
  /** User's plan tier */
  planTier: PlanTier;
  /** Optional className */
  className?: string;
  /** Callback when user wants to create new template */
  onCreateNew?: () => void;
}

/**
 * TemplateManager Component
 *
 * Displays and manages export templates.
 */
export function TemplateManager({
  planTier,
  className = '',
  onCreateNew,
}: TemplateManagerProps) {
  const { templates, isLoading, error, refresh, deleteTemplate, duplicateTemplate } =
    useExportTemplates();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);

  const maxTemplates = EXPORT_LIMITS[planTier].maxTemplates;
  const currentCount = templates.length;
  const isAtLimit = maxTemplates !== Infinity && currentCount >= maxTemplates;

  const handleDuplicate = async (template: TemplateResponse) => {
    if (isAtLimit) {
      toast.error('Template-Limit erreicht', {
        description: `Du kannst maximal ${maxTemplates} Templates speichern.`,
      });
      return;
    }

    setIsDuplicating(template.id);

    try {
      await duplicateTemplate(template);
      toast.success('Template dupliziert', {
        description: `„${template.name}" wurde kopiert.`,
      });
    } catch (error) {
      toast.error('Duplizieren fehlgeschlagen');
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const success = await deleteTemplate(deleteId);

    if (success) {
      toast.success('Template gelöscht');
    } else {
      toast.error('Löschen fehlgeschlagen');
    }

    setDeleteId(null);
  };

  const getFormatIcon = (format: 'csv' | 'excel') => {
    return format === 'csv' ? (
      <FileText className="h-4 w-4 text-blue-500" />
    ) : (
      <FileSpreadsheet className="h-4 w-4 text-green-500" />
    );
  };

  const getTypeLabel = (type: ExportType) => {
    switch (type) {
      case 'contacts':
        return 'Kontakte';
      case 'deals':
        return 'Deals';
      case 'leads':
        return 'Leads';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-center">
        <p className="text-destructive">Fehler beim Laden der Templates</p>
        <Button variant="outline" size="sm" onClick={() => refresh()} className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" />
          Erneut versuchen
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {currentCount} von{' '}
          {maxTemplates === Infinity ? 'unbegrenzt' : maxTemplates} Templates
          verwendet
        </div>
        {onCreateNew && (
          <Button
            size="sm"
            onClick={onCreateNew}
            disabled={isAtLimit}
          >
            <Plus className="mr-2 h-4 w-4" />
            Neues Template
          </Button>
        )}
      </div>

      {/* Template List */}
      {templates.length === 0 ? (
        <div className="rounded-md bg-muted p-8 text-center">
          <p className="text-muted-foreground">Noch keine Templates vorhanden</p>
          <p className="text-sm text-muted-foreground mt-1">
            Speichere häufig verwendete Export-Einstellungen als Template.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getFormatIcon(template.format)}
                      {template.name}
                    </CardTitle>
                    <CardDescription>
                      {template.description || 'Keine Beschreibung'}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDuplicate(template)}
                        disabled={isDuplicating === template.id || isAtLimit}
                      >
                        {isDuplicating === template.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        Duplizieren
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled>
                        <Pencil className="mr-2 h-4 w-4" />
                        Bearbeiten
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteId(template.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Löschen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{getTypeLabel(template.exportType)}</Badge>
                  <Badge variant="outline">{template.columns.length} Spalten</Badge>
                  {template.isPublic && (
                    <Badge variant="outline" className="gap-1">
                      <FileText className="h-3 w-3" />
                      Team
                    </Badge>
                  )}
                  {template.lastUsedAt && (
                    <span className="text-xs text-muted-foreground ml-auto">
                      Zuletzt verwendet: {formatDate(template.lastUsedAt)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Template löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Das Template
              wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TemplateManager;
