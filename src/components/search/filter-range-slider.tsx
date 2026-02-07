/**
 * Filter Range Slider Component
 *
 * A dual-range slider for filtering numeric ranges like employee count or revenue.
 * Supports both single-value and range-based filtering.
 *
 * @module FilterRangeSlider
 * @requires @radix-ui/react-slider
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'

/** Range value type with min and max */
export interface RangeValue {
  min: number
  max: number
}

interface FilterRangeSliderProps {
  /** Current range value */
  value: RangeValue
  /** Callback when range changes */
  onChange: (value: RangeValue) => void
  /** Label displayed above the slider */
  label: string
  /** Minimum possible value */
  min: number
  /** Maximum possible value */
  max: number
  /** Step size for slider */
  step?: number
  /** Unit to display (e.g., "Mio €", "Mitarbeiter") */
  unit?: string
  /** Format function for display values */
  formatValue?: (value: number) => string
  /** Whether the slider is disabled */
  disabled?: boolean
  /** Optional description text */
  description?: string
  /** Optional additional className */
  className?: string
}

/**
 * FilterRangeSlider Component
 *
 * Renders a dual-handle range slider with min/max input fields.
 *
 * @example
 * ```tsx
 * <FilterRangeSlider
 *   label="Mitarbeiterzahl"
 *   value={{ min: 10, max: 100 }}
 *   onChange={(value) => setEmployeeRange(value)}
 *   min={1}
 *   max={1000}
 *   unit="MA"
 * />
 * ```
 */
export function FilterRangeSlider({
  value,
  onChange,
  label,
  min,
  max,
  step = 1,
  unit = '',
  formatValue = (v) => v.toLocaleString('de-DE'),
  disabled = false,
  description,
  className,
}: FilterRangeSliderProps) {
  const [localValue, setLocalValue] = useState<[number, number]>([value.min, value.max])
  const [isDragging, setIsDragging] = useState(false)

  // Sync local state with prop changes
  useEffect(() => {
    setLocalValue([value.min, value.max])
  }, [value.min, value.max])

  // Handle slider change
  const handleSliderChange = useCallback(
    (newValue: number[]) => {
      const [newMin, newMax] = newValue as [number, number]
      setLocalValue([newMin, newMax])
      if (!isDragging) {
        onChange({ min: newMin, max: newMax })
      }
    },
    [isDragging, onChange]
  )

  // Handle slider commit (on pointer up)
  const handleSliderCommit = useCallback(
    (newValue: number[]) => {
      const [newMin, newMax] = newValue as [number, number]
      setIsDragging(false)
      onChange({ min: newMin, max: newMax })
    },
    [onChange]
  )

  // Handle min input change
  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.max(min, Math.min(parseInt(e.target.value) || min, localValue[1]))
    setLocalValue([newMin, localValue[1]])
    onChange({ min: newMin, max: localValue[1] })
  }

  // Handle max input change
  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.min(max, Math.max(parseInt(e.target.value) || max, localValue[0]))
    setLocalValue([localValue[0], newMax])
    onChange({ min: localValue[0], max: newMax })
  }

  // Reset to full range
  const handleReset = () => {
    setLocalValue([min, max])
    onChange({ min, max })
  }

  const isFullRange = localValue[0] === min && localValue[1] === max

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {!isFullRange && (
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Zurücksetzen
          </button>
        )}
      </div>

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}

      {/* Value Display & Inputs */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="number"
            value={localValue[0]}
            onChange={handleMinInputChange}
            min={min}
            max={localValue[1]}
            disabled={disabled}
            className={cn(
              'w-full px-2 py-1.5 text-sm border rounded-md bg-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {unit}
          </span>
        </div>

        <span className="text-muted-foreground">–</span>

        <div className="relative flex-1">
          <input
            type="number"
            value={localValue[1]}
            onChange={handleMaxInputChange}
            min={localValue[0]}
            max={max}
            disabled={disabled}
            className={cn(
              'w-full px-2 py-1.5 text-sm border rounded-md bg-background',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {unit}</span>
        </div>
      </div>

      {/* Range Slider */}
      <div className="pt-1">
        <Slider
          value={localValue}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          onValueChange={handleSliderChange}
          onValueCommit={handleSliderCommit}
          onPointerDown={() => setIsDragging(true)}
          className={disabled ? 'opacity-50' : ''}
        />
      </div>

      {/* Min/Max Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {formatValue(min)} {unit}
        </span>
        <span>
          {formatValue(max)} {unit}
        </span>
      </div>
    </div>
  )
}

/**
 * Simple Filter Slider (single value)
 *
 * For simpler use cases where only a single threshold is needed
 */
interface FilterSliderProps {
  value: number
  onChange: (value: number) => void
  label: string
  min: number
  max: number
  step?: number
  unit?: string
  disabled?: boolean
  className?: string
}

export function FilterSlider({
  value,
  onChange,
  label,
  min,
  max,
  step = 1,
  unit = '',
  disabled = false,
  className,
}: FilterSliderProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-sm text-muted-foreground">
          {value.toLocaleString('de-DE')} {unit}
        </span>
      </div>

      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
        className={disabled ? 'opacity-50' : ''}
      />

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  )
}

/**
 * Radius Filter Component
 *
 * Specialized slider for location radius with km unit
 */
interface RadiusFilterProps {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
  className?: string
}

const RADIUS_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
  { value: 250, label: '250 km' },
]

export function RadiusFilter({ value, onChange, disabled = false, className }: RadiusFilterProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Umkreis</label>
        <span className="text-sm font-medium text-primary">{value} km</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {RADIUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md border transition-all',
              value === option.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted border-input',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
