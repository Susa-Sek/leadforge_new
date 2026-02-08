'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, User, Coins, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdjustCredits, useSearchUsersForCreditAdjustment } from '@/hooks/use-admin'

const formSchema = z.object({
  user_id: z.string().min(1, 'Nutzer ist erforderlich'),
  amount: z.number().int().min(-10000).max(10000),
  reason: z.string().min(3, 'Grund ist erforderlich (min. 3 Zeichen)'),
})

type FormData = z.infer<typeof formSchema>

interface CreditAdjustmentFormProps {
  onSuccess?: () => void
}

export function CreditAdjustmentForm({ onSuccess }: CreditAdjustmentFormProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string; name: string | null } | null>(null)

  const { users, isLoading: isSearching } = useSearchUsersForCreditAdjustment(searchQuery)
  const { trigger: adjustCredits, isMutating: isAdjusting } = useAdjustCredits()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      reason: '',
    },
  })

  const amount = watch('amount')

  const handleUserSelect = (user: { id: string; email: string; name: string | null }) => {
    setSelectedUser(user)
    setValue('user_id', user.id)
    setOpen(false)
  }

  const onSubmit = async (data: FormData) => {
    try {
      await adjustCredits(data)
      toast.success(
        `${data.amount > 0 ? 'Credits hinzugefügt' : 'Credits abgezogen'}: ${Math.abs(data.amount)} Credits`
      )
      reset()
      setSelectedUser(null)
      onSuccess?.()
    } catch (error) {
      toast.error('Fehler beim Anpassen der Credits')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Credits anpassen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Nutzer auswählen</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between"
                >
                  {selectedUser ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="truncate">{selectedUser.name || selectedUser.email}</span>
                    </div>
                  ) : (
                    'Nutzer suchen...'
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command>
                  <CommandInput
                    placeholder="E-Mail oder Name suchen..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>Keine Nutzer gefunden.</CommandEmpty>
                    <CommandGroup>
                      {isSearching ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          Suche...
                        </div>
                      ) : (
                        users.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={user.email}
                            onSelect={() => handleUserSelect(user)}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedUser?.id === user.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-col">
                              <span>{user.name || user.email}</span>
                              {user.name && (
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              )}
                            </div>
                          </CommandItem>
                        ))
                      )}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.user_id && (
              <p className="text-sm text-red-500">{errors.user_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Betrag</Label>
            <div className="flex items-center gap-2">
              <Input
                id="amount"
                type="number"
                {...register('amount', { valueAsNumber: true })}
                className={cn(
                  amount > 0 && 'border-green-500 focus-visible:ring-green-500',
                  amount < 0 && 'border-red-500 focus-visible:ring-red-500'
                )}
              />
              <Badge
                variant={amount > 0 ? 'default' : amount < 0 ? 'destructive' : 'secondary'}
              >
                {amount > 0 ? 'Hinzufügen' : amount < 0 ? 'Abziehen' : 'Neutral'}
              </Badge>
            </div>
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Grund</Label>
            <Textarea
              id="reason"
              {...register('reason')}
              placeholder="Warum werden die Credits angepasst?"
              rows={3}
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isAdjusting || !selectedUser}
          >
            {isAdjusting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird verarbeitet...
              </>
            ) : (
              <>
                <Coins className="mr-2 h-4 w-4" />
                Credits anpassen
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
