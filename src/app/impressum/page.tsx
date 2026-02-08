import { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Impressum - Manyleads.io',
  description: 'Rechtliche Angaben gemäß § 5 TMG',
}

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Impressum</h1>
          <p className="text-muted-foreground">
            Rechtliche Angaben gemäß § 5 TMG (Telemediengesetz)
          </p>
        </div>

        <Card>
          <CardContent className="p-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Angaben gemäß § 5 TMG</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Manyleads.io</strong></p>
                <p>[Straße und Hausnummer]</p>
                <p>[PLZ] [Ort]</p>
                <p className="pt-4">
                  <strong>Kontakt:</strong><br />
                  E-Mail: support@manyleads.io
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Vertreten durch</h2>
              <div className="space-y-2 text-sm">
                <p><strong>[Name der vertretungsberechtigten Person]</strong></p>
                <p>[Position, z.B. Geschäftsführer/Inhaber]</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Umsatzsteuer-ID</h2>
              <div className="space-y-2 text-sm">
                <p>
                  Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
                </p>
                <p>[USt-IdNr., z.B. DE123456789]</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Handelsregister</h2>
              <div className="space-y-2 text-sm">
                <p>Eintragung im Handelsregister:</p>
                <p>Registergericht: [Registergericht]</p>
                <p>Registernummer: [HR-Nummer]</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
              <div className="space-y-2 text-sm">
                <p><strong>[Name der verantwortlichen Person]</strong></p>
                <p>[Anschrift]</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Haftung für Inhalte</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten
                  nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als
                  Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
                  Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige
                  Tätigkeit hinweisen.
                </p>
                <p>
                  Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den
                  allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch
                  erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
                  Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend
                  entfernen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Haftung für Links</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
                  keinen Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine
                  Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige
                  Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten Seiten wurden zum
                  Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft. Rechtswidrige Inhalte
                  waren zum Zeitpunkt der Verlinkung nicht erkennbar.
                </p>
                <p>
                  Eine permanente inhaltliche Kontrolle der verlinkten Seiten ist jedoch ohne konkrete
                  Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von
                  Rechtsverletzungen werden wir derartige Links umgehend entfernen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Urheberrecht</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen
                  dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede
                  Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
                  Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite
                  sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
                </p>
                <p>
                  Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die
                  Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet.
                  Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen
                  entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte
                  umgehend entfernen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">Online-Streitbeilegung</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                </p>
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
                <p className="pt-2">
                  Unsere E-Mail-Adresse finden Sie oben im Impressum.
                </p>
                <p>
                  Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                  Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}