'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { Building2, Euro, Percent, MoreHorizontal, Trash2, Edit } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

import type { Deal } from '@/lib/crm/types';

interface DealCardProps {
  deal: Deal;
  onDelete?: (id: string) => void;
  dragEnabled?: boolean;
}

export function DealCard({ deal, onDelete, dragEnabled }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: deal.id,
    disabled: !dragEnabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const stageColor = deal.stage?.color || '#6B7280';

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(dragEnabled ? listeners : {})}
      className={`${dragEnabled ? 'cursor-grab active:cursor-grabbing' : ''} hover:shadow-md transition-shadow`}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/dashboard/deals/${deal.id}`}
            className="font-medium text-sm hover:text-primary transition-colors line-clamp-2 flex-1"
          >
            {deal.title}
          </Link>
          {onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-6 w-6 p-0 -mr-1 -mt-1 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/deals/${deal.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Bearbeiten
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDelete(deal.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {deal.contact && (
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3" />
            <Link
              href={`/dashboard/kontakte/${deal.contact.id}`}
              className="hover:text-primary transition-colors line-clamp-1"
            >
              {deal.contact.company}
            </Link>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 font-medium">
            <Euro className="h-3.5 w-3.5" />
            {formatCurrency(deal.value)}
          </div>
          {deal.probability !== null && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Percent className="h-3 w-3" />
              {deal.probability}%
            </div>
          )}
        </div>

        {deal.probability !== null && (
          <div className="mt-2">
            <Progress value={deal.probability} className="h-1" />
          </div>
        )}

        {deal.is_won !== null && (
          <Badge
            variant={deal.is_won ? 'default' : 'secondary'}
            className={`mt-2 text-xs ${deal.is_won ? 'bg-green-600' : 'bg-red-600'}`}
          >
            {deal.is_won ? 'Gewonnen' : 'Verloren'}
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
