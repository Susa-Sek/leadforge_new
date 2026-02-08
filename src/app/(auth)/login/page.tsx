'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock } from 'lucide-react'
import { GoogleButton } from '@/components/auth/google-button'
import { Separator } from '@/components/ui/separator'

const loginSchema = z.object({
  email: z.string().email('Bitte gib eine gültige E-Mail-Adresse ein.'),
  password: z.string().min(1, 'Bitte gib dein Passwort ein.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    const { error, data } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'E-Mail oder Passwort ist falsch.'
          : error.message
      )
      setIsLoading(false)
      return
    }

    // BUG FIX: Check if session exists before proceeding
    if (!data.session) {
      setError('Anmeldung fehlgeschlagen. Bitte versuche es erneut.')
      setIsLoading(false)
      return
    }

    // BUG-6 FIX: Check if user is suspended after login
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_suspended')
        .eq('id', data.user.id)
        .single()

      if (profile?.is_suspended) {
        // Sign out the suspended user
        await supabase.auth.signOut()
        setError('Dein Konto wurde gesperrt. Bitte kontaktiere den Support.')
        setIsLoading(false)
        return
      }
    }

    // BUG FIX: Use hard redirect instead of client-side navigation
    // This ensures cookies are properly set before the dashboard loads
    window.location.href = '/dashboard'
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold gradient-text">
          Anmelden
        </CardTitle>
        <CardDescription>
          Melde dich an, um auf dein Konto zuzugreifen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-Mail</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="name@beispiel.de"
                        type="email"
                        autoComplete="email"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Passwort</FormLabel>
                    <Link
                      href="/passwort-vergessen"
                      className="text-xs text-primary hover:underline"
                    >
                      Passwort vergessen?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Dein Passwort"
                        type="password"
                        autoComplete="current-password"
                        className="pl-9"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird angemeldet...
                </>
              ) : (
                'Anmelden'
              )}
            </Button>
          </form>
        </Form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">oder</span>
          </div>
        </div>

        <GoogleButton mode="login" />
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          Noch kein Konto?{' '}
          <Link href="/registrieren" className="font-medium text-primary hover:underline">
            Jetzt registrieren
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
