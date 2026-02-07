'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Search,
  MapPin,
  Building2,
  Users,
  Coins,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { INDUSTRY_OPTIONS, GERMAN_CITIES, type SearchParams, calculateSearchCost } from '@/lib/search/types'

// Form validation schema
const searchFormSchema = z.object({
  branche: z.string().min(1, 'Bitte wähle eine Branche aus'),
  standort: z.string().min(2, 'Standort muss mindestens 2 Zeichen haben').max(100),
  maxResults: z.number().min(10).max(100),
})

type SearchFormValues = z.infer<typeof searchFormSchema>

interface SearchFormProps {
  onSearchStart: (params: SearchParams) => void
  userCredits: number
  isLoading?: boolean
  className?: string
}

export function SearchForm({
  onSearchStart,
  userCredits,
  isLoading = false,
  className,
}: SearchFormProps) {
  const [citySuggestions, setCitySuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      branche: '',
      standort: '',
      maxResults: 50,
    },
  })

  const maxResults = form.watch('maxResults')
  const creditsCost = useMemo(() => calculateSearchCost(maxResults), [maxResults])
  const hasEnoughCredits = userCredits >= creditsCost
  const creditPercentage = userCredits > 0 ? (creditsCost / userCredits) * 100 : 0

  // Handle city autocomplete
  const handleCityInput = (value: string) => {
    form.setValue('standort', value)

    if (value.length >= 2) {
      const matches = GERMAN_CITIES.filter(city =>
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5)
      setCitySuggestions(matches)
      setShowSuggestions(matches.length > 0)
    } else {
      setCitySuggestions([])
      setShowSuggestions(false)
    }
  }

  const selectCity = (city: string) => {
    form.setValue('standort', city)
    setShowSuggestions(false)
  }

  const onSubmit = (values: SearchFormValues) => {
    if (!hasEnoughCredits) return

    onSearchStart({
      branche: values.branche,
      standort: values.standort,
      maxResults: values.maxResults,
    })
  }

  return (
    <Card className={cn('glass-card', className)}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Search className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Lead-Suche</CardTitle>
            <CardDescription>
              Finde qualifizierte B2B-Leads nach Branche und Standort
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Branche Select */}
            <FormField
              control={form.control}
              name="branche"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Branche
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Branche auswählen..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Standort Input with Autocomplete */}
            <FormField
              control={form.control}
              name="standort"
              render={({ field }) => (
                <FormItem className="relative">
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Standort
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="z.B. Hamburg, Berlin, München..."
                      {...field}
                      onChange={(e) => handleCityInput(e.target.value)}
                      onFocus={() => field.value?.length >= 2 && setShowSuggestions(citySuggestions.length > 0)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                  </FormControl>

                  {/* City Suggestions Dropdown */}
                  {showSuggestions && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                      {citySuggestions.map((city) => (
                        <button
                          key={city}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                          onMouseDown={() => selectCity(city)}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Max Results Slider */}
            <FormField
              control={form.control}
              name="maxResults"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Maximale Ergebnisse: {field.value}
                  </FormLabel>
                  <FormControl>
                    <div className="pt-2">
                      <Slider
                        min={10}
                        max={100}
                        step={10}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Credit Preview */}
            <div className={cn(
              'rounded-lg border p-4 transition-colors',
              hasEnoughCredits
                ? 'border-border bg-muted/50'
                : 'border-destructive bg-destructive/10'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className={cn(
                    'h-4 w-4',
                    hasEnoughCredits ? 'text-muted-foreground' : 'text-destructive'
                  )} />
                  <span className="text-sm font-medium">Kosten:</span>
                </div>
                <span className={cn(
                  'font-bold',
                  hasEnoughCredits ? 'text-foreground' : 'text-destructive'
                )}>
                  {creditsCost} {creditsCost === 1 ? 'Credit' : 'Credits'}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Verfügbar: {userCredits} Credits
                </span>
                <span className={cn(
                  creditPercentage > 50 ? 'text-amber-500' : 'text-muted-foreground',
                  creditPercentage > 80 && 'text-destructive'
                )}>
                  {creditPercentage.toFixed(0)}% deiner Credits
                </span>
              </div>

              {/* Progress bar showing credit usage */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    hasEnoughCredits
                      ? creditPercentage > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      : 'bg-destructive'
                  )}
                  style={{ width: `${Math.min(creditPercentage, 100)}%` }}
                />
              </div>

              {!hasEnoughCredits && (
                <div className="mt-3 flex items-center gap-2 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>
                    Nicht genug Credits. Benötigt: {creditsCost}, Verfügbar: {userCredits}
                  </span>
                </div>
              )}
            </div>

            {/* Error Alert */}
            {form.formState.errors.branche && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Fehler</AlertTitle>
                <AlertDescription>
                  {form.formState.errors.branche.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !hasEnoughCredits}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Suche wird gestartet...
                </>
              ) : (
                <>
                  Suche starten
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {!hasEnoughCredits && !isLoading && (
              <p className="text-center text-xs text-muted-foreground">
                <a href="/dashboard/credits" className="text-primary hover:underline">
                  Credits aufladen
                </a>{' '}
                um die Suche zu starten
              </p>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
