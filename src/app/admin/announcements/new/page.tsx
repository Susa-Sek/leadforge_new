'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnnouncementEditor } from '@/components/admin/announcement-editor'
import { useCreateAnnouncement } from '@/hooks/use-admin'
import { toast } from 'sonner'
import type { CreateAnnouncementRequest } from '@/lib/admin/types'

export default function NewAnnouncementPage() {
  const router = useRouter()
  const { trigger: createAnnouncement, isMutating } = useCreateAnnouncement()

  const handleSave = async (data: CreateAnnouncementRequest) => {
    try {
      await createAnnouncement(data)
      toast.success('Ankündigung erstellt')
      router.push('/admin/announcements')
    } catch (error) {
      toast.error('Fehler beim Erstellen der Ankündigung')
      throw error
    }
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
          <h1 className="text-2xl font-bold tracking-tight">Neue Ankündigung</h1>
          <p className="text-muted-foreground">
            Erstellen Sie eine neue Systemankündigung
          </p>
        </div>
      </div>

      <AnnouncementEditor onSave={handleSave} isSubmitting={isMutating} />
    </div>
  )
}
