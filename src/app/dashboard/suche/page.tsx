import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search } from 'lucide-react'

export default function SuchePage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Search className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">Lead-Suche</CardTitle>
          <CardDescription>
            {"Finde qualifizierte B2B-Leads mit KI-gest\u00FCtzter Suche. Filtere nach Branche, Standort, Unternehmensgr\u00F6\u00DFe und mehr."}
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
