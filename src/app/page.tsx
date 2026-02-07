import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Search, Users, Mail } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold gradient-text">Manyleads</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Anmelden</Button>
            </Link>
            <Link href="/registrieren">
              <Button>Registrieren</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Finde <span className="gradient-text">qualifizierte B2B-Leads</span>
            <br />
            mit KI-gestützter Suche
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Durchsuche tausende Unternehmen nach Branche, Standort und Größe.
            Erhalte Kontaktdaten, die wirklich konvertieren.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/registrieren">
              <Button size="lg" className="gap-2">
                Jetzt starten <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Anmelden
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16 border-t">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-card p-6 rounded-lg">
              <Search className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Intelligente Suche</h3>
              <p className="text-muted-foreground">
                Filtere nach Branche, Standort, Unternehmensgröße und mehr.
              </p>
            </div>
            <div className="glass-card p-6 rounded-lg">
              <Users className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Verifizierte Kontakte</h3>
              <p className="text-muted-foreground">
                Erhalte aktuelle E-Mail-Adressen und Telefonnummern von Entscheidern.
              </p>
            </div>
            <div className="glass-card p-6 rounded-lg">
              <Mail className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">CRM-Integration</h3>
              <p className="text-muted-foreground">
                Verwalte deine Leads direkt im integrierten CRM-System.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          © 2026 Manyleads.io - Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  )
}
