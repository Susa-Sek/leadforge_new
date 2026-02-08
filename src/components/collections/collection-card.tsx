/**
 * Collection Card Component
 *
 * Displays a single collection in grid view
 * Shows preview, title, meta info, status badge and actions
 */

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Collection } from '@/lib/collections/types'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  FolderOpen,
  MapPin,
  Calendar,
  MoreVertical,
  Trash2,
  ExternalLink,
  Users,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface CollectionCardProps {
  collection: Collection
  onDelete?: (id: string) => void
  isDeleting?: boolean
}

/**
 * CollectionCard Component
 *
 * @example
 * ```tsx
 * <CollectionCard
 *   collection={collection}
 *   onDelete={(id) => handleDelete(id)}
 * />
 * ```
 */
export function CollectionCard({
  collection,
  onDelete,
  isDeleting = false,
}: CollectionCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const formattedDate = format(new Date(collection.created_at), 'dd.MM.yyyy', {
    locale: de,
  })

  const handleDelete = () => {
    onDelete?.(collection.id)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-all duration-200 hover-lift">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">
                  {collection.name}
                </h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {collection.query_params.location}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/sammlungen/${collection.id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Öffnen
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-3">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{collection.result_count}</span>
              <span className="text-muted-foreground">Leads</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 flex items-center justify-between">
          <StatusBadge status={collection.status} />
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-primary hover:text-primary"
          >
            <Link href={`/dashboard/sammlungen/${collection.id}`}>
              Anzeigen
              <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sammlung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du die Sammlung &quot;{collection.name}&quot; wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Wird gelöscht...' : 'Löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/**
 * Status Badge Component
 *
 * Shows collection/search status with appropriate colors
 */
interface StatusBadgeProps {
  status: 'completed' | 'failed' | 'pending' | 'running'
}

function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    completed: {
      label: 'Abgeschlossen',
      variant: 'default' as const,
      icon: CheckCircle2,
      className: 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400',
    },
    failed: {
      label: 'Fehlgeschlagen',
      variant: 'destructive' as const,
      icon: AlertCircle,
      className: '',
    },
    pending: {
      label: 'Ausstehend',
      variant: 'secondary' as const,
      icon: null,
      className: '',
    },
    running: {
      label: 'Laufend',
      variant: 'secondary' as const,
      icon: null,
      className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400',
    },
  }

  const { label, icon: Icon, className } = config[status]

  return (
    <Badge variant="secondary" className={cn(className)}>
      {Icon && <Icon className="mr-1 h-3 w-3" />}
      {label}
    </Badge>
  )
}

export { StatusBadge }
export default CollectionCard
