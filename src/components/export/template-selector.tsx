/**
 * Template Selector Component
 *
 * Dropdown for selecting saved export templates.
 *
 * @module TemplateSelector
 */

'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, FileSpreadsheet } from 'lucide-react';
import type { TemplateResponse, ExportType } from '@/lib/export/types';

interface TemplateSelectorProps {
  /** Available templates */
  templates: TemplateResponse[];
  /** Currently selected template ID */
  selectedId?: string;
  /** Selection callback */
  onSelect: (templateId: string) => void;
  /** Export type to filter by */
  exportType: ExportType;
  /** Optional className */
  className?: string;
}

/**
 * TemplateSelector Component
 *
 * Dropdown for selecting export templates.
 */
export function TemplateSelector({
  templates,
  selectedId,
  onSelect,
  exportType,
  className = '',
}: TemplateSelectorProps) {
  // Filter templates by export type
  const filteredTemplates = templates.filter(
    (t) => t.exportType === exportType
  );

  if (filteredTemplates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Keine Templates vorhanden. Erstelle ein Template, um diese Einstellungen zu speichern.
      </p>
    );
  }

  return (
    <Select value={selectedId} onValueChange={onSelect}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Template auswählen..." />
      </SelectTrigger>
      <SelectContent>
        {filteredTemplates.map((template) => (
          <SelectItem key={template.id} value={template.id}>
            <div className="flex items-center gap-2">
              {template.format === 'csv' ? (
                <FileText className="h-4 w-4 text-muted-foreground" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="flex-1">{template.name}</span>
              <Badge variant="secondary" className="text-xs">
                {template.columns.length} Spalten
              </Badge>
              {template.isPublic && (
                <Badge variant="outline" className="text-xs">
                  Team
                </Badge>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default TemplateSelector;
