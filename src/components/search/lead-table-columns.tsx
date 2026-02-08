/**
 * Lead Table Column Definitions
 *
 * Defines all columns for the lead results table with plan-based feature gating.
 * Different plan tiers unlock different columns:
 * - Free: Basic data (Company, Email, Website)
 * - Pro: + Industry, Employee count, Rating, CSV Export
 * - Enterprise: + LinkedIn/Xing profiles, Excel Export, API access
 *
 * @module LeadTableColumns
 * @requires @/lib/search/types
 * @requires @/components/ui/table
 * @requires lucide-react
 */

import { SearchResultLead } from '@/lib/search/types'
import { ColumnDef } from '@tanstack/react-table'
import { ArrowUpDown, Mail, Phone, Globe, Linkedin, Building2, MapPin, Star, Users, Clock, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { PlanGate } from './plan-gate'

/** User's subscription plan tier */
export type PlanTier = 'free' | 'pro' | 'enterprise'

/** Column visibility configuration per plan tier */
export interface ColumnVisibilityConfig {
  industry: boolean
  employeeCount: boolean
  rating: boolean
  reviewsCount: boolean
  socialLinks: boolean
  phone: boolean
  export: boolean
  // BUG-11 FIX: Opening hours and image columns
  openingHours: boolean
  image: boolean
}

/**
 * Get column visibility based on user's plan tier
 * @param planTier - The user's subscription tier
 * @returns Column visibility configuration
 */
export function getColumnVisibility(planTier: PlanTier): ColumnVisibilityConfig {
  switch (planTier) {
    case 'enterprise':
      return {
        industry: true,
        employeeCount: true,
        rating: true,
        reviewsCount: true,
        socialLinks: true,
        phone: true,
        export: true,
        // BUG-11 FIX: Enterprise gets opening hours and image
        openingHours: true,
        image: true,
      }
    case 'pro':
      return {
        industry: true,
        employeeCount: true,
        rating: true,
        reviewsCount: true,
        socialLinks: false,
        phone: true,
        export: true,
        // BUG-11 FIX: Pro gets opening hours and image
        openingHours: true,
        image: true,
      }
    case 'free':
    default:
      return {
        industry: false,
        employeeCount: false,
        rating: false,
        reviewsCount: false,
        socialLinks: false,
        phone: false,
        export: false,
        // BUG-11 FIX: Free users don't get opening hours and image
        openingHours: false,
        image: false,
      }
  }
}

/**
 * Create table column definitions with plan-based gating
 * @param planTier - The user's subscription tier
 * @returns Array of column definitions for TanStack Table
 */
export function createColumns(planTier: PlanTier): ColumnDef<SearchResultLead>[] {
  const visibility = getColumnVisibility(planTier)

  return [
    // Selection Checkbox
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Alle auswählen"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Zeile auswählen"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },

    // Company Name (always visible)
    {
      accessorKey: 'companyName',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          <Building2 className="mr-2 h-4 w-4" />
          Firma
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="font-medium">{row.getValue('companyName')}</div>,
    },

    // Contact Person (Pro+ only - completely hidden for Free per E5-REQUIREMENTS.md)
    {
      accessorKey: 'contactPerson',
      header: 'Kontakt',
      cell: ({ row }) => {
        // BUG-2 FIX: Contact person completely hidden for Free users
        if (planTier === 'free') {
          return (
            <PlanGate requiredPlan="pro" featureName="Kontaktpersonen">
              <span className="text-muted-foreground">-</span>
            </PlanGate>
          )
        }
        const contact = row.getValue('contactPerson') as string | undefined
        return <div className="text-muted-foreground">{contact || '-'}</div>
      },
    },

    // Address (always visible)
    {
      accessorKey: 'address',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          <MapPin className="mr-2 h-4 w-4" />
          Adresse
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div className="max-w-[200px] truncate text-sm">{row.getValue('address')}</div>,
    },

    // Email (Pro+ only - blurred for Free)
    {
      accessorKey: 'email',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          <Mail className="mr-2 h-4 w-4" />
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        // BUG-2 FIX: Email is blurred for Free users (Pro+ feature per E5-REQUIREMENTS.md)
        if (planTier === 'free') {
          return (
            <PlanGate requiredPlan="pro" featureName="E-Mail-Adressen">
              <span className="text-muted-foreground">-</span>
            </PlanGate>
          )
        }
        const email = row.getValue('email') as string | undefined
        return email ? (
          <a href={`mailto:${email}`} className="text-primary hover:underline text-sm">
            {email}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },

    // Phone (Pro+ only)
    {
      accessorKey: 'phone',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          <Phone className="mr-2 h-4 w-4" />
          Telefon
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        if (!visibility.phone) {
          return (
            <PlanGate requiredPlan="pro" featureName="Telefonnummern">
              <span className="text-muted-foreground">-</span>
            </PlanGate>
          )
        }
        const phone = row.getValue('phone') as string | undefined
        return phone ? (
          <a href={`tel:${phone}`} className="text-primary hover:underline text-sm">
            {phone}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },

    // Website (Pro+ only - blurred for Free)
    {
      accessorKey: 'website',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          <Globe className="mr-2 h-4 w-4" />
          Website
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        // BUG-2 FIX: Website is blurred for Free users (Pro+ feature per E5-REQUIREMENTS.md)
        if (planTier === 'free') {
          return (
            <PlanGate requiredPlan="pro" featureName="Website-URLs">
              <span className="text-muted-foreground">-</span>
            </PlanGate>
          )
        }
        const website = row.getValue('website') as string | undefined
        return website ? (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline text-sm truncate max-w-[150px] inline-block"
          >
            {website.replace(/^https?:\/\//, '').replace(/\/+$/, '')}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },

    // Industry (Pro+ only)
    {
      accessorKey: 'category',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Branche
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        if (!visibility.industry) {
          return (
            <PlanGate requiredPlan="pro" featureName="Branche">
              <span className="text-muted-foreground">-</span>
            </PlanGate>
          )
        }
        const category = row.getValue('category') as string | undefined
        return category ? <Badge variant="secondary">{category}</Badge> : <span className="text-muted-foreground">-</span>
      },
    },

    // Rating & Reviews (Pro+ only)
    {
      accessorKey: 'rating',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          <Star className="mr-2 h-4 w-4" />
          Bewertung
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        if (!visibility.rating) {
          return (
            <PlanGate requiredPlan="pro" featureName="Bewertungen">
              <span className="text-muted-foreground">-</span>
            </PlanGate>
          )
        }
        const rating = row.getValue('rating') as number | undefined
        const reviewsCount = row.original.reviewsCount
        if (!rating) return <span className="text-muted-foreground">-</span>
        return (
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            {reviewsCount !== undefined && reviewsCount > 0 && (
              <span className="text-muted-foreground text-xs">({reviewsCount})</span>
            )}
          </div>
        )
      },
    },

    // BUG-11 FIX: Opening Hours (Pro+)
    {
      id: 'openingHours',
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          <Clock className="mr-2 h-4 w-4" />
          Öffnungszeiten
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        if (!visibility.openingHours) {
          return (
            <PlanGate requiredPlan="pro" featureName="Öffnungszeiten">
              <span className="text-muted-foreground">-</span>
            </PlanGate>
          )
        }
        const hours = row.original.openingHours
        if (!hours || Object.keys(hours).length === 0) {
          return <span className="text-muted-foreground">-</span>
        }
        // Show today's hours or a summary
        const today = new Date().toLocaleDateString('de-DE', { weekday: 'long' })
        const todayKey = Object.keys(hours).find(k => k.toLowerCase().includes(today.toLowerCase()))
        if (todayKey) {
          return (
            <div className="text-sm" title={Object.entries(hours).map(([k, v]) => `${k}: ${v}`).join('\n')}>
              <span className="font-medium">Heute:</span> {hours[todayKey]}
            </div>
          )
        }
        // Show first available day
        const firstDay = Object.entries(hours)[0]
        return (
          <div className="text-sm" title={Object.entries(hours).map(([k, v]) => `${k}: ${v}`).join('\n')}>
            <span className="font-medium">{firstDay[0]}:</span> {firstDay[1]}
          </div>
        )
      },
    },

    // BUG-11 FIX: Image (Pro+)
    {
      id: 'image',
      header: 'Bild',
      cell: ({ row }) => {
        if (!visibility.image) {
          return (
            <PlanGate requiredPlan="pro" featureName="Firmenbilder">
              <span className="text-muted-foreground">-</span>
            </PlanGate>
          )
        }
        const imageUrl = row.original.imageUrl
        if (!imageUrl) {
          return <span className="text-muted-foreground">-</span>
        }
        return (
          <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block">
            <img
              src={imageUrl}
              alt={row.original.companyName}
              className="h-12 w-12 object-cover rounded-md hover:scale-110 transition-transform"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </a>
        )
      },
    },

    // Social Links (Enterprise only)
    {
      id: 'socialLinks',
      header: 'Social Media',
      cell: ({ row }) => {
        if (!visibility.socialLinks) {
          return (
            <PlanGate requiredPlan="enterprise" featureName="Social Media Links">
              <span className="text-muted-foreground">-</span>
            </PlanGate>
          )
        }
        const socials = row.original.socialLinks
        const linkedin = socials?.linkedin
        return (
          <div className="flex gap-2">
            {linkedin ? (
              <a
                href={linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
                title="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        )
      },
    },

    // Google Maps Link (always visible)
    {
      id: 'googleMaps',
      header: 'Karte',
      cell: ({ row }) => (
        <a
          href={row.original.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline text-sm"
        >
          Maps
        </a>
      ),
    },
  ]
}

/**
 * Get available column IDs for column visibility toggle
 * @returns Array of column ID and label pairs
 */
export function getColumnOptions(): { id: string; label: string }[] {
  return [
    { id: 'select', label: 'Auswahl' },
    { id: 'companyName', label: 'Firma' },
    { id: 'contactPerson', label: 'Kontakt' },
    { id: 'address', label: 'Adresse' },
    { id: 'email', label: 'Email' },
    { id: 'phone', label: 'Telefon' },
    { id: 'website', label: 'Website' },
    { id: 'category', label: 'Branche' },
    { id: 'rating', label: 'Bewertung' },
    // BUG-11 FIX: Add opening hours and image to column options
    { id: 'openingHours', label: 'Öffnungszeiten' },
    { id: 'image', label: 'Bild' },
    { id: 'socialLinks', label: 'Social Media' },
    { id: 'googleMaps', label: 'Karte' },
  ]
}
