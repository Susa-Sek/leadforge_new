/**
 * Scheduled Export List Component
 *
 * Displays and manages scheduled exports (Enterprise feature).
 *
 * @module ScheduledExportList
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
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Clock,
  Calendar,
  Mail,
  MoreHorizontal,
  Trash2,
  Loader2,
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useScheduledExports } from '@/hooks/use-export';
import { formatDateTime, formatDate } from '@/lib/export/types';
import type { ScheduledExportResponse, ScheduledFrequency } from '@/lib/export/types';
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

interface ScheduledExportListProps {
  /** Optional className */
  className?: string;
}

/**
 * ScheduledExportList Component
 *
 * Displays scheduled exports with toggle and delete actions.
 */
export function ScheduledExportList({ className = '' }: ScheduledExportListProps) {
  const {
    scheduledExports,
    isLoading,
    error,
    refresh,
    deleteScheduledExport,
    toggleScheduledExport,
  } = useScheduledExports();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (id: string, currentState: boolean) => {
    setTogglingId(id);

    try {
      const success = await toggleScheduledExport(id, !currentState);

      if (success) {
        toast.success(currentState ? 'Geplanter Export pausiert' : 'Geplanter Export aktiviert');
      } else {
        toast.error('Aktion fehlgeschlagen');
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const success = await deleteScheduledExport(deleteId);

      if (success) {
        toast.success('Geplanter Export gelöscht');
      } else {
        toast.error('Löschen fehlgeschlagen');
      }
    } finally {
      setDeleteId(null);
    }
  };

  const getFrequencyLabel = (frequency: ScheduledFrequency) => {
    switch (frequency) {
      case 'daily':
        return 'Täglich';
      case 'weekly':
        return 'Wöchentlich';
      case 'monthly':
        return 'Monatlich';
      default:
        return frequency;
    }
  };

  const getDayLabel = (frequency: ScheduledFrequency, dayOfWeek?: number, dayOfMonth?: number) => {
    if (frequency === 'weekly' && dayOfWeek !== undefined) {
      const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      return days[dayOfWeek];
    }
    if (frequency === 'monthly' && dayOfMonth !== undefined) {
      return `${dayOfMonth}.`;
    }
    return null;
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
        <p className="text-destructive">Fehler beim Laden der geplanten Exporte</p>
        <Button variant="outline" size="sm" onClick={() => refresh()} className="mt-2">
          <RefreshCw className="mr-2 h-4 w-4" />
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (scheduledExports.length === 0) {
    return (
      <div className="rounded-md bg-muted p-8 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground font-medium">Keine geplanten Exporte</p>
        <p className="text-sm text-muted-foreground mt-1">
          Erstelle einen geplanten Export, um automatisch Daten zu empfangen.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${className}`}>
      {scheduledExports.map((scheduled) => (
        <Card key={scheduled.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">{scheduled.name}</CardTitle>
                <CardDescription>
                  Template: {scheduled.templateName}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={scheduled.isActive}
                  onCheckedChange={() => handleToggle(scheduled.id, scheduled.isActive)}
                  disabled={togglingId === scheduled.id}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => handleToggle(scheduled.id, scheduled.isActive)}
                    >
                      {scheduled.isActive ? (
                        <>
                          <Pause className="mr-2 h-4 w-4" />
                          Pausieren
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-4 w-4" />
                          Aktivieren
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteId(scheduled.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Schedule Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Häufigkeit</span>
                </div>
                <p className="font-medium">
                  {getFrequencyLabel(scheduled.frequency)}
                  {getDayLabel(scheduled.frequency, scheduled.dayOfWeek, scheduled.dayOfMonth) && (
                    <span className="ml-1 text-muted-foreground">
                      ({getDayLabel(scheduled.frequency, scheduled.dayOfWeek, scheduled.dayOfMonth)})
                    </span>
                  )}
                  <span className="ml-1 text-muted-foreground">um {scheduled.timeOfDay}</span>
                </p>
              </div>

              {/* Next Run */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Nächster Lauf</span>
                </div>
                <p className="font-medium">
                  {scheduled.nextRunAt ? (
                    formatDateTime(scheduled.nextRunAt)
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </p>
              </div>

              {/* Email Recipients */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>Empfänger</span>
                </div>
                <p className="font-medium truncate">
                  {scheduled.emailRecipients.length} E-Mail(s)
                </p>
              </div>

              {/* Run Stats */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="h-4 w-4" />
                  <span>Ausführungen</span>
                </div>
                <p className="font-medium">
                  {scheduled.runCount} Läufe
                  {scheduled.failCount > 0 && (
                    <span className="ml-1 text-destructive">
                      ({scheduled.failCount} Fehler)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-4 flex items-center gap-2">
              {scheduled.isActive ? (
                <Badge variant="default" className="gap-1">
                  <Play className="h-3 w-3" />
                  Aktiv
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <Pause className="h-3 w-3" />
                  Pausiert
                </Badge>
              )}
              {scheduled.deliveryMethod === 'attachment' ? (
                <Badge variant="outline">Mit Anhang</Badge>
              ) : (
                <Badge variant="outline">Nur Link</Badge>
              )}
              {(scheduled as any).lastErrorMessage && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Letzter Lauf fehlgeschlagen
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Geplanten Export löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der geplante
              Export wird dauerhaft gelöscht.
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

export default ScheduledExportList;
