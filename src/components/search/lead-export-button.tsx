/**
 * Lead Export Button Component
 *
 * Provides CSV and Excel export functionality for lead search results.
 * Features are gated by subscription plan:
 * - Free: No export (shows upgrade prompt)
 * - Pro: CSV export
 * - Enterprise: CSV + Excel export
 *
 * Uses xlsx library for Excel generation and native CSV formatting.
 *
 * @module LeadExportButton
 * @requires xlsx
 * @requires @/lib/search/types
 * @requires @/components/ui/button
 * @requires @/components/ui/dropdown-menu
 */

'use client'

import { useState } from 'react'
import { SearchResultLead } from '@/lib/search/types'
import { PlanTier } from './lead-table-columns'
import { PlanGate, UpgradePrompt } from './plan-gate'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, FileSpreadsheet, Loader2, Check } from 'lucide-react'

/** Props for the LeadExportButton component */
interface LeadExportButtonProps {
  /** Array of leads to export */
  leads: SearchResultLead[]
  /** User's subscription plan tier */
  planTier: PlanTier
  /** Optional search ID for filename */
  searchId?: string
  /** Display variant */
  variant?: 'dropdown' | 'buttons' | 'minimal'
  /** Additional CSS classes */
  className?: string
}

/** Export format type */
type ExportFormat = 'csv' | 'excel'

/**
 * Convert leads to CSV string
 *
 * @param leads - Array of leads to convert
 * @param planTier - Plan tier for column filtering
 * @returns CSV formatted string
 */
function convertToCSV(leads: SearchResultLead[], planTier: PlanTier): string {
  // Define columns based on plan tier
  const baseColumns = [
    { key: 'companyName', label: 'Firma' },
    { key: 'contactPerson', label: 'Kontakt' },
    { key: 'address', label: 'Adresse' },
    { key: 'email', label: 'Email' },
    { key: 'website', label: 'Website' },
  ]

  const proColumns = [
    { key: 'phone', label: 'Telefon' },
    { key: 'category', label: 'Branche' },
    { key: 'rating', label: 'Bewertung' },
    { key: 'reviewsCount', label: 'Anzahl Bewertungen' },
  ]

  const enterpriseColumns = [
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'instagram', label: 'Instagram' },
  ]

  let columns = [...baseColumns]
  if (planTier === 'pro' || planTier === 'enterprise') {
    columns = [...columns, ...proColumns]
  }
  if (planTier === 'enterprise') {
    columns = [...columns, ...enterpriseColumns]
  }

  // BUG-4 FIX: Use semicolon as separator for German Excel compatibility
  const SEPARATOR = ';'

  // Create header row with semicolon separator
  const header = columns.map((col) => col.label).join(SEPARATOR)

  // Create data rows
  const rows = leads.map((lead) => {
    return columns
      .map((col) => {
        let value: string | number | undefined

        switch (col.key) {
          case 'companyName':
            value = lead.companyName
            break
          case 'contactPerson':
            value = lead.contactPerson
            break
          case 'address':
            value = lead.address
            break
          case 'email':
            value = lead.email
            break
          case 'phone':
            value = lead.phone
            break
          case 'website':
            value = lead.website
            break
          case 'category':
            value = lead.category
            break
          case 'rating':
            // BUG-14 FIX: Use comma as decimal separator for German Excel
            value = lead.rating?.toString().replace('.', ',')
            break
          case 'reviewsCount':
            value = lead.reviewsCount
            break
          case 'linkedin':
            value = lead.socialLinks?.linkedin
            break
          case 'facebook':
            value = lead.socialLinks?.facebook
            break
          case 'instagram':
            value = lead.socialLinks?.instagram
            break
          default:
            value = ''
        }

        // Escape values for CSV (semicolon separator)
        const stringValue = String(value || '')
        if (stringValue.includes(SEPARATOR) || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      .join(SEPARATOR)
  })

  // Combine with BOM for Excel compatibility
  const BOM = '\uFEFF'
  return BOM + [header, ...rows].join('\n')
}

/**
 * Convert leads to Excel workbook and trigger download
 *
 * @param leads - Array of leads to export
 * @param planTier - Plan tier for column filtering
 * @param filename - Output filename
 */
async function exportToExcel(
  leads: SearchResultLead[],
  planTier: PlanTier,
  filename: string
): Promise<void> {
  // Dynamic import xlsx to avoid SSR issues
  const XLSX = await import('xlsx')

  // Define columns based on plan tier
  const baseColumns = [
    { key: 'companyName', label: 'Firma' },
    { key: 'contactPerson', label: 'Kontakt' },
    { key: 'address', label: 'Adresse' },
    { key: 'email', label: 'Email' },
    { key: 'website', label: 'Website' },
  ]

  const proColumns = [
    { key: 'phone', label: 'Telefon' },
    { key: 'category', label: 'Branche' },
    { key: 'rating', label: 'Bewertung' },
    { key: 'reviewsCount', label: 'Anzahl Bewertungen' },
  ]

  const enterpriseColumns = [
    { key: 'linkedin', label: 'LinkedIn' },
    { key: 'facebook', label: 'Facebook' },
    { key: 'instagram', label: 'Instagram' },
  ]

  let columns = [...baseColumns]
  if (planTier === 'pro' || planTier === 'enterprise') {
    columns = [...columns, ...proColumns]
  }
  if (planTier === 'enterprise') {
    columns = [...columns, ...enterpriseColumns]
  }

  // Transform data for Excel
  const data = leads.map((lead) => {
    const row: Record<string, string | number | undefined> = {}

    columns.forEach((col) => {
      switch (col.key) {
        case 'companyName':
          row[col.label] = lead.companyName
          break
        case 'contactPerson':
          row[col.label] = lead.contactPerson
          break
        case 'address':
          row[col.label] = lead.address
          break
        case 'email':
          row[col.label] = lead.email
          break
        case 'phone':
          row[col.label] = lead.phone
          break
        case 'website':
          row[col.label] = lead.website
          break
        case 'category':
          row[col.label] = lead.category
          break
        case 'rating':
          row[col.label] = lead.rating
          break
        case 'reviewsCount':
          row[col.label] = lead.reviewsCount
          break
        case 'linkedin':
          row[col.label] = lead.socialLinks?.linkedin
          break
        case 'facebook':
          row[col.label] = lead.socialLinks?.facebook
          break
        case 'instagram':
          row[col.label] = lead.socialLinks?.instagram
          break
      }
    })

    return row
  })

  // Create workbook
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')

  // Auto-size columns
  const colWidths = columns.map((col) => ({
    wch: Math.max(col.label.length, 15),
  }))
  worksheet['!cols'] = colWidths

  // Download file
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

/**
 * Trigger CSV download
 *
 * @param content - CSV content string
 * @param filename - Output filename
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

/**
 * Generate filename with timestamp
 *
 * @param searchId - Optional search ID
 * @param format - File format
 * @returns Formatted filename
 */
function generateFilename(searchId: string | undefined, format: ExportFormat): string {
  const date = new Date().toISOString().split('T')[0]
  const id = searchId ? `_${searchId.slice(0, 8)}` : ''
  return `leads${id}_${date}`
}

/**
 * LeadExportButton Component
 *
 * Export button with plan-based feature gating.
 *
 * @example
 * ```tsx
 * <LeadExportButton
 *   leads={searchResults}
 *   planTier="pro"
 *   searchId="search-123"
 *   variant="dropdown"
 * />
 * ```
 */
export function LeadExportButton({
  leads,
  planTier,
  searchId,
  variant = 'dropdown',
  className = '',
}: LeadExportButtonProps) {
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Free users see upgrade prompt
  if (planTier === 'free') {
    return (
      <PlanGate requiredPlan="pro" featureName="Export-Funktion" variant="inline">
        <Button variant="outline" size="sm" disabled className={className}>
          <Download className="mr-2 h-4 w-4" />
          Exportieren
        </Button>
      </PlanGate>
    )
  }

  const handleExport = async (format: ExportFormat) => {
    if (leads.length === 0) return

    setIsExporting(format)

    try {
      const filename = generateFilename(searchId, format)

      if (format === 'csv') {
        const csv = convertToCSV(leads, planTier)
        downloadCSV(csv, filename)
      } else if (format === 'excel' && planTier === 'enterprise') {
        await exportToExcel(leads, planTier, filename)
      }

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(null)
    }
  }

  // Minimal variant - single button for CSV only
  if (variant === 'minimal') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExport('csv')}
        disabled={isExporting !== null || leads.length === 0}
        className={className}
      >
        {isExporting === 'csv' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : showSuccess ? (
          <Check className="mr-2 h-4 w-4 text-green-500" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        CSV
      </Button>
    )
  }

  // Buttons variant - separate buttons side by side
  if (variant === 'buttons') {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExport('csv')}
          disabled={isExporting !== null || leads.length === 0}
        >
          {isExporting === 'csv' ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          CSV
        </Button>

        {planTier === 'enterprise' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('excel')}
            disabled={isExporting !== null || leads.length === 0}
          >
            {isExporting === 'excel' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Excel
          </Button>
        )}

        {planTier === 'pro' && (
          <PlanGate requiredPlan="enterprise" featureName="Excel Export" variant="inline">
            <Button variant="outline" size="sm" disabled>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
          </PlanGate>
        )}
      </div>
    )
  }

  // Dropdown variant (default) - menu with all options
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting !== null || leads.length === 0}
          className={className}
        >
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : showSuccess ? (
            <Check className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Exportieren
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Format wählen</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleExport('csv')}>
          <FileText className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>CSV Export</span>
            <span className="text-xs text-muted-foreground">
              Kompatibel mit Excel, Google Sheets
            </span>
          </div>
        </DropdownMenuItem>

        {planTier === 'enterprise' ? (
          <DropdownMenuItem onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            <div className="flex flex-col">
              <span>Excel Export (.xlsx)</span>
              <span className="text-xs text-muted-foreground">Mit Formatierung</span>
            </div>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem disabled>
            <PlanGate requiredPlan="enterprise" featureName="Excel Export" variant="inline">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <div className="flex flex-col">
                  <span>Excel Export (.xlsx)</span>
                </div>
              </div>
            </PlanGate>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default LeadExportButton
