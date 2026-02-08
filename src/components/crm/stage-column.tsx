'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import { DealCard } from './deal-card';
import type { PipelineColumn } from '@/lib/crm/types';

interface StageColumnProps {
  column: PipelineColumn;
  onDeleteDeal: (id: string) => void;
  dragEnabled: boolean;
}

export function StageColumn({ column, onDeleteDeal, dragEnabled }: StageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.stage.id,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card
      ref={setNodeRef}
      className={`flex flex-col h-full min-w-[280px] max-w-[320px] ${
        isOver ? 'ring-2 ring-primary ring-offset-2' : ''
      }`}
      style={{ backgroundColor: `${column.stage.color}10` }}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: column.stage.color }}
            />
            <h3 className="font-semibold text-sm">{column.stage.name}</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {column.count}
          </Badge>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {formatCurrency(column.totalValue)}
          </span>
          <Link href={`/dashboard/deals/neu?stage=${column.stage.id}`}>
            <Button size="icon" variant="ghost" className="h-6 w-6">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 flex-1">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-2 pr-2">
            <SortableContext
              items={column.deals.map((d) => d.id)}
              strategy={verticalListSortingStrategy}
            >
              {column.deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onDelete={onDeleteDeal}
                  dragEnabled={dragEnabled}
                />
              ))}
            </SortableContext>
            {column.deals.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg border-muted">
                Keine Deals
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
