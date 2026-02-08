// Suspended Account Page - E11 BUG-1 Fix
// Route: /konto-gesperrt
// Shown when a suspended user tries to access protected routes

import Link from 'next/link'
import { Ban, Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SuspendedAccountPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <Ban className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Konto gesperrt</CardTitle>
          <CardDescription>
            Ihr Account wurde vorübergehend gesperrt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground text-center">
            Sie haben keinen Zugriff auf die Plattform, da Ihr Konto gesperrt wurde.
            Dies kann verschiedene Gründe haben, wie z.B. Verstoß gegen unsere Nutzungsbedingungen
            oder ungewöhnliche Aktivitäten.
          </p>

          <div className="space-y-3">
            <p className="text-sm font-medium text-center">Was können Sie tun?</p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Kontaktieren Sie unseren Support für weitere Informationen</li>
              <li>Prüfen Sie Ihre E-Mails auf Benachrichtigungen von uns</li>
              <li>Warten Sie auf die Entsperrung durch einen Administrator</li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button asChild variant="default">
              <a href="mailto:support@manyleads.io">
                <Mail className="w-4 h-4 mr-2" />
                Support kontaktieren
              </a>
            </Button>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück zur Startseite
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Support-E-Mail:{' '}
            <a href="mailto:support@manyleads.io" className="underline">
              support@manyleads.io
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
