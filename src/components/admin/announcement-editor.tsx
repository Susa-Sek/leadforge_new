'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Megaphone, Loader2, Trash2, Save, Info, AlertTriangle, CheckCircle, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Announcement, CreateAnnouncementRequest, AnnouncementType } from '@/lib/admin/types'
import { ANNOUNCEMENT_TYPE_LABELS, ANNOUNCEMENT_TYPE_COLORS } from '@/lib/admin/types'
import { format } from 'date-fns'

const formSchema = z.object({
  title: z.string().min(3, 'Titel muss mindestens 3 Zeichen haben'),
  message: z.string().min(10, 'Nachricht muss mindestens 10 Zeichen haben'),
  type: z.enum(['info', 'warning', 'success', 'maintenance']),
  is_active: z.boolean(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface AnnouncementEditorProps {
  announcement?: Announcement | null
  onSave: (data: CreateAnnouncementRequest) => Promise<void>
  onDelete?: () => Promise<void>
  isSubmitting?: boolean
  isDeleting?: boolean
}

const typeIcons: Record<AnnouncementType, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  maintenance: Wrench,
}

export function AnnouncementEditor({
  announcement,
  onSave,
  onDelete,
  isSubmitting = false,
  isDeleting = false,
}: AnnouncementEditorProps) {
  const isEditing = !!announcement

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: announcement?.title || '',
      message: announcement?.message || '',
      type: announcement?.type || 'info',
      is_active: announcement?.is_active ?? true,
      start_date: announcement?.start_date
        ? format(new Date(announcement.start_date), 'yyyy-MM-dd')
        : '',
      end_date: announcement?.end_date
        ? format(new Date(announcement.end_date), 'yyyy-MM-dd')
        : '',
    },
  })

  const selectedType = watch('type')
  const isActive = watch('is_active')
  const TypeIcon = typeIcons[selectedType]

  const onSubmit = async (data: FormData) => {
    const requestData: CreateAnnouncementRequest = {
      title: data.title,
      message: data.message,
      type: data.type,
      is_active: data.is_active,
      start_date: data.start_date || undefined,
      end_date: data.end_date || undefined,
    }
    await onSave(requestData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          {isEditing ? 'Ankündigung bearbeiten' : 'Neue Ankündigung'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="z.B. Wartungsarbeiten am Server"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Nachricht</Label>
            <Textarea
              id="message"
              {...register('message')}
              placeholder="Detaillierte Beschreibung der Ankündigung..."
              rows={4}
            />
            {errors.message && (
              <p className="text-sm text-red-500">{errors.message.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Typ</Label>
              <Select
                value={selectedType}
                onValueChange={(value) => setValue('type', value as AnnouncementType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ANNOUNCEMENT_TYPE_LABELS).map(([type, label]) => {
                    const Icon = typeIcons[type as AnnouncementType]
                    return (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <div className={cn('h-2 w-2 rounded-full', ANNOUNCEMENT_TYPE_COLORS[type as AnnouncementType])} />
                          <Icon className="h-4 w-4" />
                          {label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => setValue('is_active', checked)}
                />
                Aktiv
              </Label>
              <p className="text-xs text-muted-foreground">
                Inaktive Ankündigungen werden nicht angezeigt
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Startdatum (optional)</Label>
              <Input
                id="start_date"
                type="date"
                {...register('start_date')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">Enddatum (optional)</Label>
              <Input
                id="end_date"
                type="date"
                {...register('end_date')}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Aktualisieren' : 'Erstellen'}
                </>
              )}
            </Button>

            {isEditing && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>

          <div className="border rounded-lg p-4 mt-4">
            <p className="text-sm text-muted-foreground mb-2">Vorschau:</p>
            <div className={cn('p-4 rounded-lg border-l-4', ANNOUNCEMENT_TYPE_COLORS[selectedType])}>
              <div className="flex items-start gap-3">
                <TypeIcon className="h-5 w-5 mt-0.5" />
                <div>
                  <h4 className="font-semibold">{watch('title') || 'Titel'}</h4>
                  <p className="text-sm mt-1">{watch('message') || 'Nachrichtentext'}</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
