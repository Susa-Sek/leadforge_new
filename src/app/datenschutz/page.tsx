import { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung - Manyleads.io',
  description: 'Informationen zur Verarbeitung Ihrer personenbezogenen Daten',
}

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Datenschutzerklärung</h1>
          <p className="text-muted-foreground">
            Informationen zur Verarbeitung Ihrer personenbezogenen Daten gemäß DSGVO
          </p>
        </div>

        <Card>
          <CardContent className="p-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Verantwortliche Stelle</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Manyleads.io</strong></p>
                <p>[Straße und Hausnummer]</p>
                <p>[PLZ] [Ort]</p>
                <p className="pt-4">E-Mail: support@manyleads.io</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Allgemeines zur Datenverarbeitung</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Wir verarbeiten Ihre personenbezogenen Daten nur auf Basis der gesetzlichen Erlaubnistatbestände.
                  Insbesondere verarbeiten wir Daten, wenn dies zur Erfüllung unserer vertraglichen Verpflichtungen
                  erforderlich ist (Art. 6 Abs. 1 lit. b DSGVO), wenn wir eine berechtigte Interessenabwägung
                  durchführen können (Art. 6 Abs. 1 lit. f DSGVO) oder wenn Sie in die Verarbeitung eingewilligt haben
                  (Art. 6 Abs. 1 lit. a DSGVO).
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. Datenverarbeitung bei der Registrierung</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Bei der Registrierung auf unserer Plattform erheben wir folgende Daten:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Name und E-Mail-Adresse</li>
                  <li>Passwort (verschlüsselt gespeichert)</li>
                  <li>Firmenname, Job-Title (freiwillige Angabe)</li>
                  <li>Zahlungsinformationen (bei kostenpflichtigen Abos)</li>
                </ul>
                <p className="pt-2">
                  <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
                </p>
                <p>
                  <strong>Speicherdauer:</strong> Bis zur Löschung Ihres Kontos oder bis zur gesetzlichen Aufbewahrungsfrist
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Nutzung der Plattform</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Bei der Nutzung unserer Dienste verarbeiten wir:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Suchanfragen und Filterkriterien</li>
                  <li>Exportierte Kontaktdaten</li>
                  <li>Credit-Transaktionen und Verlauf</li>
                  <li>Kontaktaufnahmen und Interaktionen im CRM</li>
                </ul>
                <p className="pt-2">
                  <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Cookies</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Wir verwenden Cookies, um die Nutzerfreundlichkeit unserer Webseite zu verbessern.
                  Dabei unterscheiden wir zwischen technisch notwendigen Cookies und optionalen Cookies.
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Technisch notwendige:</strong> Session-Cookies für die Authentifizierung</li>
                  <li><strong>Optional:</strong> Analyse-Cookies zur Verbesserung der Nutzererfahrung</li>
                </ul>
                <p className="pt-2">
                  <strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO (Berechtigtes Interesse)
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Weitergabe von Daten an Dritte</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Wir geben Ihre Daten nur an Dritte weiter, wenn dies für die Vertragserfüllung erforderlich
                  ist oder wenn Sie eingewilligt haben:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Zahlungsanbieter:</strong> Stripe (Kreditkartenabwicklung)</li>
                  <li><strong>Authentifizierung:</strong> Supabase (Auth- und Datenbankservice)</li>
                  <li><strong>CRM-Exporte:</strong> HubSpot, Salesforce, Pipedrive (auf Ihren Wunsch)</li>
                </ul>
                <p className="pt-2">
                  Alle externen Dienstleister werden sorgfältig ausgewählt und unterliegen strengen
                  Datenschutzverpflichtungen. Die Datenverarbeitung erfolgt ausschließlich innerhalb der
                  EU/EEG.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Datenquelle für Leads</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Die über unsere Plattform bereitgestellten Kontaktdaten stammen aus öffentlich zugänglichen
                  Quellen und werden auf Basis des berechtigten Interesses nach Art. 6 Abs. 1 lit. f DSGVO
                  verarbeitet. Dies umfasst:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Unternehmensregister und öffentliche Datenbanken</li>
                  <li>Webseiten und Social-Media-Profile von Unternehmen</li>
                  <li>Presse- und Branchenpublikationen</li>
                </ul>
                <p className="pt-2">
                  Wir verifizieren alle Daten vor der Bereitstellung und stellen sicher, dass die Verarbeitung
                  DSGVO-konform erfolgt. Unsere Server stehen in Deutschland.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">8. Ihre Rechte als Betroffener</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Ihnen stehen folgende Rechte gemäß DSGVO zu:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Informationsrecht:</strong> Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)</li>
                  <li><strong>Berichtigungsrecht:</strong> Korrektur falscher Daten (Art. 16 DSGVO)</li>
                  <li><strong>Löschungsrecht:</strong> Löschung Ihrer Daten (Art. 17 DSGVO)</li>
                  <li><strong>Einschränkungsrecht:</strong> Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                  <li><strong>Übertragbarkeit:</strong> Datenübertragung an andere Anbieter (Art. 20 DSGVO)</li>
                  <li><strong>Widerspruchsrecht:</strong> Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
                </ul>
                <p className="pt-2">
                  Zur Ausübung dieser Rechte kontaktieren Sie uns unter support@manyleads.io
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">9. Widerruf der Einwilligung</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Sie können eine bereits erteilte Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen.
                  Der Widerruf kann per E-Mail an support@manyleads.io oder über Ihr Benutzerkonto erfolgen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">10. Datenlöschung und Kontosperrung</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Sie können Ihr Benutzerkonto jederzeit über die Einstellungen löschen. Alternativ können Sie
                  eine Kontolöschung über E-Mail beantragen. Bei einer Löschung werden alle personenbezogenen
                  Daten permanent entfernt, soweit keine gesetzlichen Aufbewahrungsfristen entgegenstehen.
                </p>
                <p>
                  <strong>Ausnahmen von der Löschung:</strong> Gesetzliche Aufbewahrungsfristen (z.B. Handels-
                  und Steuerrecht) können bis zu 10 Jahre betragen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">11. Änderungen dieser Datenschutzerklärung</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Wir behalten uns vor, diese Datenschutzerklärung gelegentlich zu aktualisieren. Die aktuelle
                  Version finden Sie auf unserer Webseite. Änderungen werden auf dieser Seite veröffentlicht.
                </p>
                <p className="pt-2">
                  <strong>Stand:</strong> {new Date().toLocaleDateString('de-DE')}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">12. Kontakt bei Datenschutzfragen</h2>
              <div className="space-y-2 text-sm">
                <p>
                  Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte kontaktieren Sie uns bitte:
                </p>
                <p className="pt-2">
                  <strong>E-Mail:</strong> support@manyleads.io
                </p>
                <p>
                  Wir werden Ihre Anfrage so schnell wie möglich, spätestens jedoch innerhalb von einem Monat
                  bearbeiten.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">13. Beschwerderecht bei Aufsichtsbehörde</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Sie haben das Recht, sich bei einer Aufsichtsbehörde für den Datenschutz über die Verarbeitung
                  Ihrer personenbezogenen Daten durch uns zu beschweren. Zuständige Behörde ist:
                </p>
                <p className="pt-2">
                  <strong>Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit</strong><br />
                  [Adresse der zuständigen Landesbehörde]
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}