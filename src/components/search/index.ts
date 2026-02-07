/**
 * Search Components Barrel Export
 *
 * Central export point for all search-related components.
 *
 * @module SearchComponents
 */

// Core search components
export { SearchForm } from './search-form'
export { SearchProgress } from './search-progress'
export { ActiveSearchBanner, registerActiveSearch } from './active-search-banner'

// Lead results components (PROJ-16)
export { LeadResultsTable } from './lead-results-table'
export { LeadExportButton } from './lead-export-button'
export { createColumns, getColumnVisibility, getColumnOptions } from './lead-table-columns'
export { PlanGate, PlanGateBadge, UpgradePrompt } from './plan-gate'

// Smart Filter Components (PROJ-17)
export { SmartFilter, useSmartFilter, DEFAULT_FILTER_STATE } from './smart-filter'
export { FilterToggleGroup, CompactFilterToggle } from './filter-toggle-group'
export { FilterRangeSlider, FilterSlider, RadiusFilter } from './filter-range-slider'
export { ActiveFilters, FilterSummary, FilterIndicator } from './active-filters'
export { QuickFilterBar } from './quick-filter-bar'

// Types
export type { PlanTier, ColumnVisibilityConfig } from './lead-table-columns'
export type { SmartFilterState } from './smart-filter'
export type { FilterState } from './filter-toggle-group'
export type { RangeValue } from './filter-range-slider'
export type { ActiveFilter } from './active-filters'
export type { QuickFilterState } from './quick-filter-bar'
