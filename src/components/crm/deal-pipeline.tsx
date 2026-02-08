'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { toast } from 'sonner';

import { usePipeline, useUpdateDealStage, useDeleteDeal } from '@/hooks/use-crm';
import { StageColumn } from './stage-column';
import { DealCard } from './deal-card';
import { WonLostDialog } from './won-lost-dialog';
import type { Deal } from '@/lib/crm/types';

interface DealPipelineProps {
  dragEnabled?: boolean;
}

export function DealPipeline({ dragEnabled = false }: DealPipelineProps) {
  const { columns, mutate, isLoading } = usePipeline();
  const { trigger: updateStage } = useUpdateDealStage();
  const { trigger: deleteDeal } = useDeleteDeal();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDeal, setActiveDeal] = useState<Deal | null>(null);
  const [wonLostDialogOpen, setWonLostDialogOpen] = useState(false);
  const [dealToClose, setDealToClose] = useState<Deal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Find the deal being dragged
    for (const column of columns) {
      const deal = column.deals.find((d) => d.id === active.id);
      if (deal) {
        setActiveDeal(deal);
        break;
      }
    }
  }, [columns]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveDeal(null);

    if (!over) return;

    const dealId = active.id as string;
    const newStageId = over.id as string;

    // Find current deal and stage
    let deal: Deal | undefined;
    let currentStageId: string | undefined;

    for (const column of columns) {
      const found = column.deals.find((d) => d.id === dealId);
      if (found) {
        deal = found;
        currentStageId = column.stage.id;
        break;
      }
    }

    if (!deal || currentStageId === newStageId) return;

    // Find target stage
    const targetColumn = columns.find((c) => c.stage.id === newStageId);
    if (!targetColumn) return;

    // Check if target is "Geschlossen" stage
    const isClosingStage = targetColumn.stage.is_won_stage || targetColumn.stage.is_lost_stage;

    if (isClosingStage) {
      // Show won/lost dialog
      setDealToClose(deal);
      setWonLostDialogOpen(true);
    } else {
      // Update stage immediately
      try {
        await updateStage({
          dealId,
          data: { stage_id: newStageId },
        });
        toast.success('Stage aktualisiert');
      } catch (error) {
        toast.error('Fehler beim Verschieben');
      }
    }
  }, [columns, mutate, updateStage]);

  const handleCloseDeal = async (data: { is_won: boolean; close_reason?: string }) => {
    if (!dealToClose) return;

    // Find closing stage
    const closingColumn = columns.find(
      (c) => (data.is_won && c.stage.is_won_stage) || (!data.is_won && c.stage.is_lost_stage)
    );

    if (!closingColumn) {
      toast.error('Schließungs-Stage nicht gefunden');
      return;
    }

    try {
      await updateStage({
        dealId: dealToClose.id,
        data: {
          stage_id: closingColumn.stage.id,
          is_won: data.is_won,
          close_reason: data.close_reason,
        },
      });
      toast.success(data.is_won ? 'Deal gewonnen!' : 'Deal als verloren markiert');
    } catch (error) {
      toast.error('Fehler beim Schließen des Deals');
    } finally {
      setWonLostDialogOpen(false);
      setDealToClose(null);
    }
  };

  const handleDeleteDeal = async (dealId: string) => {
    try {
      await deleteDeal(dealId as any);
      toast.success('Deal gelöscht');
      mutate();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={dragEnabled ? handleDragStart : undefined}
        onDragEnd={dragEnabled ? handleDragEnd : undefined}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 px-1">
          {columns.map((column) => (
            <StageColumn
              key={column.stage.id}
              column={column}
              onDeleteDeal={handleDeleteDeal}
              dragEnabled={dragEnabled}
            />
          ))}
        </div>
        <DragOverlay>
          {activeDeal ? (
            <div className="opacity-80 rotate-2">
              <DealCard deal={activeDeal} dragEnabled={false} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <WonLostDialog
        open={wonLostDialogOpen}
        onOpenChange={setWonLostDialogOpen}
        onConfirm={handleCloseDeal}
        dealTitle={dealToClose?.title || ''}
      />
    </>
  );
}
