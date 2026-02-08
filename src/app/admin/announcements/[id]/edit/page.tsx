'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AnnouncementEditor } from '@/components/admin/announcement-editor'
import {
  useAdminAnnouncement,
  useUpdateAnnouncement,
  useDeleteAnnouncement,
} from '@/hooks/use-admin'
import { toast } from 'sonner'
import type { CreateAnnouncementRequest } from '@/lib/admin/types'

export default function EditAnnouncementPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const { announcement, isLoading } = useAdminAnnouncement(id)
  const { trigger: updateAnnouncement, isMutating: isUpdating } = useUpdateAnnouncement()
  const { trigger: deleteAnnouncement, isMutating: isDeleting } = useDeleteAnnouncement()

  const handleSave = async (data: CreateAnnouncementRequest) => {
    try {
      await updateAnnouncement({ id, data })
      toast.success('Ankündigung aktualisiert')
      router.push('/admin/announcements')
    } catch (error) {
      toast.error('Fehler beim Aktualisieren')
      throw error
    }
  }

  const handleDelete = async () => {
    try {
      await deleteAnnouncement(id)
      toast.success('Ankündigung gelöscht')
      router.push('/admin/announcements')
    } catch (error) {
      toast.error('Fehler beim Löschen')
      throw error
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-[500px]" />
      </div>
    )
  }

  if (!announcement) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/announcements">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Link>
          </Button>
        </div>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Ankündigung nicht gefunden</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/announcements">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ankündigung bearbeiten</h1>
          <p className="text-muted-foreground">
            Bearbeiten Sie die Systemankündigung
          </p>
        </div>
      </div>

      <AnnouncementEditor
        announcement={announcement}
        onSave={handleSave}
        onDelete={handleDelete}
        isSubmitting={isUpdating}
        isDeleting={isDeleting}
      />
    </div>
  )
}
