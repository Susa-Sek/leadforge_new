/**
 * Collection Stats Component
 *
 * Displays statistics for a collection:
 * - Total leads
 * - Average rating
 * - Contact statistics (website, email, phone, social media)
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  Star,
  Globe,
  Mail,
  Phone,
  Share2,
  MessageSquare,
} from 'lucide-react'
import { CollectionStats as CollectionStatsType } from '@/lib/collections/types'

interface CollectionStatsProps {
  stats: CollectionStatsType
  isLoading?: boolean
}

/**
 * CollectionStats Component
 *
 * @example
 * ```tsx
 * <CollectionStats
 *   stats={{
 *     totalLeads: 100,
 *     averageRating: 4.5,
 *     totalReviews: 2500,
 *     withWebsite: 80,
 *     withEmail: 60,
 *     withPhone: 90,
 *     withSocialMedia: 45,
 *   }}
 * />
 * ```
 */
export function CollectionStats({ stats, isLoading = false }: CollectionStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-8 bg-muted rounded" />
              <div className="h-4 bg-muted rounded mt-2 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statItems = [
    {
      label: 'Leads',
      value: stats.totalLeads,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'Durchschnitt',
      value: stats.averageRating ? `${stats.averageRating.toFixed(1)} ★` : 'N/A',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    },
    {
      label: 'Bewertungen',
      value: stats.totalReviews.toLocaleString('de-DE'),
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      label: 'Kontaktdaten',
      value: `${stats.withEmail} / ${stats.withPhone}`,
      icon: Mail,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statItems.map((item) => (
        <Card key={item.label} className="hover-lift">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className={cn('p-2 rounded-lg', item.bgColor)}>
                <item.icon className={cn('h-4 w-4', item.color)} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Contact Stats Component
 *
 * Detailed breakdown of contact availability
 */
export function ContactStats({
  withWebsite,
  withEmail,
  withPhone,
  withSocialMedia,
  total,
}: {
  withWebsite: number
  withEmail: number
  withPhone: number
  withSocialMedia: number
  total: number
}) {
  const contacts = [
    { label: 'Website', count: withWebsite, icon: Globe, color: 'bg-blue-500' },
    { label: 'E-Mail', count: withEmail, icon: Mail, color: 'bg-green-500' },
    { label: 'Telefon', count: withPhone, icon: Phone, color: 'bg-purple-500' },
    { label: 'Social Media', count: withSocialMedia, icon: Share2, color: 'bg-pink-500' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Kontakt-Übersicht</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contacts.map((contact) => {
          const percentage = total > 0 ? Math.round((contact.count / total) * 100) : 0

          return (
            <div key={contact.label} className="flex items-center gap-3">
              <div className={cn('p-1.5 rounded', contact.color)}>
                <contact.icon className="h-3 w-3 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span>{contact.label}</span>
                  <span className="font-medium">
                    {contact.count} ({percentage}%)
                  </span>
                </div>
                <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', contact.color)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

import { cn } from '@/lib/utils'
export default CollectionStats
