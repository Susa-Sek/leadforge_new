import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { History } from 'lucide-react'

export default function VerlaufPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <History className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Verlauf</CardTitle>
          <CardDescription>
            {"Sieh dir deine bisherigen Suchen und Aktivit\u00E4ten an. Greife jederzeit auf fr\u00FChere Ergebnisse zur\u00FCck."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {"Diese Funktion wird bald verf\u00FCgbar sein."}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
