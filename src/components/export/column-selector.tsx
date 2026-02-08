/**
 * Column Selector Component
 *
 * Checklist component for selecting export columns with
 * plan-gating for enterprise columns.
 *
 * @module ColumnSelector
 */

'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PlanGate, PlanGateBadge } from '@/components/search/plan-gate';
import type { PlanTier } from '@/components/search/plan-gate';
import type { ColumnDefinition } from '@/lib/export/types';

interface ColumnSelectorProps {
  /** Available columns */
  columns: ColumnDefinition[];
  /** Currently selected column keys */
  selectedColumns: string[];
  /** Toggle callback */
  onToggle: (columnKey: string) => void;
  /** User's plan tier */
  planTier: PlanTier;
  /** Optional className */
  className?: string;
}

/**
 * ColumnSelector Component
 *
 * Grid of checkboxes for column selection with plan gating.
 */
export function ColumnSelector({
  columns,
  selectedColumns,
  onToggle,
  planTier,
  className = '',
}: ColumnSelectorProps) {
  // Group columns by plan requirement
  const baseColumns = columns.filter((col) => col.planRequired === 'pro');
  const enterpriseColumns = columns.filter((col) => col.planRequired === 'enterprise');

  const isEnterprise = planTier === 'enterprise';

  const ColumnItem = ({ column, disabled = false }: { column: ColumnDefinition; disabled?: boolean }) => {
    const isSelected = selectedColumns.includes(column.key);

    const content = (
      <div className={`flex items-start space-x-2 ${disabled ? 'opacity-50' : ''}`}>
        <Checkbox
          id={`col-${column.key}`}
          checked={isSelected}
          onCheckedChange={() => !disabled && onToggle(column.key)}
          disabled={disabled}
          className="mt-0.5"
        />
        <div className="flex-1">
          <Label
            htmlFor={`col-${column.key}`}
            className={`text-sm font-normal cursor-pointer ${disabled ? 'cursor-not-allowed' : ''}`}
          >
            {column.label}
          </Label>
          {column.description && (
            <p className="text-xs text-muted-foreground">{column.description}</p>
          )}
        </div>
        {column.planRequired === 'enterprise' && (
          <PlanGateBadge plan="enterprise" />
        )}
      </div>
    );

    if (disabled) {
      return (
        <PlanGate requiredPlan="enterprise" featureName={column.label} variant="inline">
          {content}
        </PlanGate>
      );
    }

    return content;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Base columns (Pro+) */}
      <div className="grid grid-cols-2 gap-3">
        {baseColumns.map((column) => (
          <ColumnItem key={column.key} column={column} />
        ))}
      </div>

      {/* Enterprise columns */}
      {enterpriseColumns.length > 0 && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <Badge variant="secondary" className="text-xs">
              Enterprise Features
            </Badge>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {enterpriseColumns.map((column) => (
              <ColumnItem
                key={column.key}
                column={column}
                disabled={!isEnterprise}
              />
            ))}
          </div>
        </>
      )}

      {selectedColumns.length === 0 && (
        <p className="text-sm text-destructive">
          Bitte wähle mindestens eine Spalte aus.
        </p>
      )}
    </div>
  );
}

export default ColumnSelector;
