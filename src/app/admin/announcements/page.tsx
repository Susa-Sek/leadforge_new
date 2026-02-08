'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle,
  Wrench,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useAdminAnnouncements,
  useToggleAnnouncementActive,
  useDeleteAnnouncement,
} from '@/hooks/use-admin'
import { ANNOUNCEMENT_TYPE_COLORS, type Announcement, type AnnouncementType } from '@/lib/admin/types'
import { cn } from '@/lib/utils'

const typeIcons: Record<AnnouncementType, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  maintenance: Wrench,
}

export default function AdminAnnouncementsPage() {
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { announcements, isLoading, mutate } = useAdminAnnouncements(true)
  const { trigger: toggleActive } = useToggleAnnouncementActive()
  const { trigger: deleteAnnouncement, isMutating: isDeleting } = useDeleteAnnouncement()

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      await toggleActive({ id, isActive: !currentState })
      toast.success(currentState ? 'Ankündigung deaktiviert' : 'Ankündigung aktiviert')
      mutate()
    } catch (error) {
      toast.error('Fehler beim Ändern des Status')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteAnnouncement(deleteId)
      toast.success('Ankündigung gelöscht')
      setDeleteId(null)
      mutate()
    } catch (error) {
      toast.error('Fehler beim Löschen')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ankündigungen</h1>
          <p className="text-muted-foreground">
            Systemankündigungen verwalten
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/announcements/new">
            <Plus className="mr-2 h-4 w-4" />
            Neue Ankündigung
          </Link>
        </Button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : announcements.length > 0 ? (
          announcements.map((announcement) => {
            const TypeIcon = typeIcons[announcement.type]
            return (
              <Card
                key={announcement.id}
                className={cn(
                  'hover-lift',
                  !announcement.is_active && 'opacity-60'
                )}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center',
                          ANNOUNCEMENT_TYPE_COLORS[announcement.type]
                        )}
                      >
                        <TypeIcon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{announcement.title}</h3>
                          <Badge
                            variant={announcement.is_active ? 'default' : 'secondary'}
                          >
                            {announcement.is_active ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">{announcement.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                          <span>
                            Erstellt:{' '}
                            {format(new Date(announcement.created_at), 'dd.MM.yyyy')}
                          </span>
                          {announcement.start_date && (
                            <span>
                              Gültig ab:{' '}
                              {format(new Date(announcement.start_date), 'dd.MM.yyyy')}
                            </span>
                          )}
                          {announcement.end_date && (
                            <span>
                              Gültig bis:{' '}
                              {format(new Date(announcement.end_date), 'dd.MM.yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2 mr-4">
                        <Switch
                          checked={announcement.is_active}
                          onCheckedChange={() =>
                            handleToggleActive(announcement.id, announcement.is_active)
                          }
                        />
                        <span className="text-sm text-muted-foreground">Aktiv</span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/announcements/${announcement.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteId(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Keine Ankündigungen vorhanden</p>
              <Button className="mt-4" asChild>
                <Link href="/admin/announcements/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Erste Ankündigung erstellen
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ankündigung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Die Ankündigung wird
              dauerhaft aus dem System entfernt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? 'Wird gelöscht...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
