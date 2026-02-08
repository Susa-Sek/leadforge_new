'use client'

import * as React from 'react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  presets?: boolean
  className?: string
}

const presets = [
  { label: '7 Tage', days: 7 },
  { label: '30 Tage', days: 30 },
  { label: '90 Tage', days: 90 },
]

export function DateRangePicker({
  value,
  onChange,
  presets: showPresets = true,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const handlePresetClick = (days: number) => {
    const to = endOfDay(new Date())
    const from = startOfDay(subDays(to, days - 1))
    onChange({ from, to })
    setIsOpen(false)
  }

  const handleCustomSelect = (range: DateRange | undefined) => {
    if (range?.from) {
      onChange({
        from: startOfDay(range.from),
        to: range.to ? endOfDay(range.to) : undefined,
      })
    } else {
      onChange(range)
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showPresets && (
        <div className="hidden sm:flex items-center gap-1">
          {presets.map((preset) => (
            <Button
              key={preset.days}
              variant="outline"
              size="sm"
              onClick={() => handlePresetClick(preset.days)}
              className="h-8 text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[260px] justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, 'dd.MM.yyyy')} -{' '}
                  {format(value.to, 'dd.MM.yyyy')}
                </>
              ) : (
                format(value.from, 'dd.MM.yyyy')
              )
            ) : (
              <span>Zeitraum wählen</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <p className="text-sm font-medium mb-2">Schnellauswahl</p>
            <div className="flex gap-1">
              {presets.map((preset) => (
                <Button
                  key={preset.days}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(preset.days)}
                  className="h-7 text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={handleCustomSelect}
            numberOfMonths={2}
          />
          <div className="p-3 border-t flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onChange(undefined)
                setIsOpen(false)
              }}
            >
              Zurücksetzen
            </Button>
            <Button size="sm" onClick={() => setIsOpen(false)}>
              Anwenden
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
