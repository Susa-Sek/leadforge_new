/**
 * Lead Results Table Component
 *
 * Main data table component for displaying search results with:
 * - Plan-based feature gating (Free/Pro/Enterprise)
 * - Pagination (10/25/50/100 per page)
 * - Column sorting
 * - Row selection with checkboxes
 * - Export functionality (CSV for Pro, Excel for Enterprise)
 * - BUG-5 FIX: Column visibility persistence in localStorage
 *
 * Uses TanStack Table for advanced table functionality and
 * shadcn/ui components for consistent styling.
 *
 * @module LeadResultsTable
 * @requires @tanstack/react-table
 * @requires @/components/ui/table
 * @requires @/components/ui/button
 * @requires @/components/ui/select
 * @requires @/components/ui/pagination
 * @requires @/lib/search/types
 */

'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type SortingState,
  type PaginationState,
  type ColumnFiltersState,
  type VisibilityState,
} from '@tanstack/react-table'
import { SearchResultLead } from '@/lib/search/types'
import { createColumns, PlanTier } from './lead-table-columns'
import { LeadExportButton } from './lead-export-button'
import { PlanGateBadge } from './plan-gate'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Columns, Download, FileSpreadsheet, FileText } from 'lucide-react'

/** Props for the LeadResultsTable component */
interface LeadResultsTableProps {
  /** Array of lead results to display */
  leads: SearchResultLead[]
  /** User's subscription plan tier for feature gating */
  planTier: PlanTier
  /** Optional search ID for export filename */
  searchId?: string
  /** Total count for pagination info */
  totalCount?: number
  /** Loading state */
  isLoading?: boolean
}

/** Page size options for pagination */
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

// BUG-5 FIX: localStorage key for column visibility persistence
const COLUMN_VISIBILITY_STORAGE_KEY = 'manyleads_column_visibility'

/**
 * LeadResultsTable Component
 *
 * Displays lead search results in a feature-gated data table.
 *
 * @example
 * ```tsx
 * <LeadResultsTable
 *   leads={searchResults}
 *   planTier="pro"
 *   searchId="search-123"
 *   totalCount={150}
 * />
 * ```
 */
export function LeadResultsTable({
  leads,
  planTier,
  searchId,
  totalCount,
  isLoading = false,
}: LeadResultsTableProps) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})

  // BUG-5 FIX: Column visibility state with localStorage persistence
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    // Try to load from localStorage on initial render
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY)
        if (stored) {
          return JSON.parse(stored)
        }
      } catch (e) {
        console.error('Failed to load column visibility from localStorage:', e)
      }
    }
    return {}
  })

  // BUG-5 FIX: Persist column visibility to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(columnVisibility))
      } catch (e) {
        console.error('Failed to save column visibility to localStorage:', e)
      }
    }
  }, [columnVisibility])

  // Create columns based on plan tier
  const columns = useMemo(() => createColumns(planTier), [planTier])

  // Initialize table
  const table = useReactTable({
    data: leads,
    columns,
    state: {
      sorting,
      pagination,
      columnFilters,
      rowSelection,
      columnVisibility, // BUG-5 FIX: Include column visibility state
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility, // BUG-5 FIX: Handle column visibility changes
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    enableRowSelection: true,
  })

  // Get selected leads for export
  const selectedLeads = useMemo(() => {
    const selectedRows = table.getSelectedRowModel().rows
    return selectedRows.map((row) => row.original)
  }, [table.getSelectedRowModel().rows])

  // Calculate pagination info
  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex + 1
  const pageSize = table.getState().pagination.pageSize
  const totalRows = leads.length

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Empty state
  if (leads.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <p className="text-lg font-medium text-muted-foreground">Keine Leads gefunden</p>
            <p className="text-sm text-muted-foreground mt-1">
              Starte eine neue Suche, um Ergebnisse zu erhalten.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Suchergebnisse</CardTitle>
            <CardDescription>
              {totalCount !== undefined ? (
                <>
                  {totalCount} Leads gefunden
                  {selectedLeads.length > 0 && (
                    <span className="ml-2 text-primary">({selectedLeads.length} ausgewählt)</span>
                  )}
                </>
              ) : (
                <>
                  {totalRows} Leads
                  {selectedLeads.length > 0 && (
                    <span className="ml-2 text-primary">({selectedLeads.length} ausgewählt)</span>
                  )}
                </>
              )}
            </CardDescription>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Column Visibility Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Columns className="mr-2 h-4 w-4" />
                  Spalten
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Sichtbare Spalten</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id === 'companyName' && 'Firma'}
                      {column.id === 'contactPerson' && 'Kontakt'}
                      {column.id === 'address' && 'Adresse'}
                      {column.id === 'email' && 'Email'}
                      {column.id === 'phone' && 'Telefon'}
                      {column.id === 'website' && 'Website'}
                      {column.id === 'category' && 'Branche'}
                      {column.id === 'rating' && 'Bewertung'}
                      {/* BUG-11 FIX: Add opening hours and image column labels */}
                      {column.id === 'openingHours' && 'Öffnungszeiten'}
                      {column.id === 'image' && 'Bild'}
                      {column.id === 'socialLinks' && 'Social Media'}
                      {column.id === 'googleMaps' && 'Karte'}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export Buttons */}
            {planTier === 'free' ? (
              <div className="flex items-center gap-2">
                <PlanGateBadge plan="pro" />
                <span className="text-xs text-muted-foreground">für Export</span>
              </div>
            ) : (
              <LeadExportButton
                leads={selectedLeads.length > 0 ? selectedLeads : leads}
                planTier={planTier}
                searchId={searchId}
                variant="dropdown"
              />
            )}
          </div>
        </div>
      </CardHeader>

      {/* BUG-6 FIX: Bulk Actions Toolbar - shown when leads are selected */}
      {selectedLeads.length > 0 && (
        <div className="bg-primary/5 border-y px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="font-medium">
                {selectedLeads.length} ausgewählt
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => table.toggleAllRowsSelected(false)}
                className="h-7 text-xs"
              >
                Auswahl aufheben
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {/* Export Button for selected leads */}
              {planTier !== 'free' ? (
                <LeadExportButton
                  leads={selectedLeads}
                  planTier={planTier}
                  searchId={searchId}
                  variant="minimal"
                />
              ) : (
                <PlanGateBadge plan="pro" />
              )}
              {/* Placeholder buttons for future features (E6, E7) */}
              <Button variant="outline" size="sm" disabled className="h-8 opacity-50">
                Zur Sammlung
              </Button>
              <Button variant="outline" size="sm" disabled className="h-8 opacity-50">
                Ins CRM
              </Button>
            </div>
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {/* Table */}
        <div className="border-t">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="hover:bg-muted/50"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="py-3">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      Keine Ergebnisse.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* BUG-8 FIX: Pagination Footer - only show when > 50 results */}
        {totalRows > 50 && (
        <div className="border-t p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Zeilen pro Seite:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="hidden sm:inline">
                Zeige {(currentPage - 1) * pageSize + 1} -{' '}
                {Math.min(currentPage * pageSize, totalRows)} von {totalRows}
              </span>
            </div>

            {/* Pagination Controls */}
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      table.previousPage()
                    }}
                    className={!table.getCanPreviousPage() ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                  // Show pages around current page
                  let pageNum: number
                  if (pageCount <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= pageCount - 2) {
                    pageNum = pageCount - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          table.setPageIndex(pageNum - 1)
                        }}
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}

                {pageCount > 5 && currentPage < pageCount - 2 && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      table.nextPage()
                    }}
                    className={!table.getCanNextPage() ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
        )}
      </CardContent>
    </Card>
  )
}

export default LeadResultsTable
