import { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'AGB - Manyleads.io',
  description: 'Allgemeine Geschäftsbedingungen für die Nutzung von Manyleads.io',
}

export default function AgbPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Allgemeine Geschäftsbedingungen</h1>
          <p className="text-muted-foreground">
            AGB für die Nutzung der B2B Lead-Generation Plattform Manyleads.io
          </p>
        </div>

        <Card>
          <CardContent className="p-8 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Geltungsbereich</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Diese Allgemeinen Geschäftsbedingungen (im Folgenden "AGB") gelten für alle Verträge über
                  die Nutzung der Plattform "Manyleads.io" (im Folgenden "Plattform" oder "Dienstleistung"),
                  die von der Manyleads.io (im Folgenden "Anbieter") betrieben wird.
                </p>
                <p>
                  Die AGB gelten für alle Nutzer, die die Plattform nutzen, unabhängig davon, ob sie
                  kostenlos registriert sind oder ein kostenpflichtiges Abonnement abgeschlossen haben.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Registrierung und Benutzerkonto</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>2.1 Voraussetzungen:</strong> Um die Plattform nutzen zu können, muss der Nutzer
                  ein Benutzerkonto erstellen. Der Nutzer muss volljährig und geschäftsfähig sein.
                </p>
                <p>
                  <strong>2.2 Registrierung:</strong> Die Registrierung erfolgt durch Angabe einer
                  gültigen E-Mail-Adresse und eines Passworts. Der Nutzer sichert zu, dass alle angegebenen
                  Daten wahrheitsgemäß und vollständig sind.
                </p>
                <p>
                  <strong>2.3 Pflichten des Nutzers:</strong> Der Nutzer verpflichtet sich,
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>seine Zugangsdaten geheim zu halten und nicht an Dritte weiterzugeben</li>
                  <li>den Anbieter unverzüglich zu informieren, wenn er Kenntnis von unbefugter Nutzung seines Kontos erhält</li>
                  <li>nur berechtigte personenbezogene Daten abzufragen und zu verwenden</li>
                  <li>die Plattform nicht für rechtswidrige Zwecke zu nutzen</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. Leistungen und Funktionsumfang</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>3.1 Umfang der Leistungen:</strong> Die Plattform bietet die Suche und Bereitstellung
                  von B2B-Kontaktdaten, einschließlich folgender Funktionen:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Suche nach Unternehmen und Kontaktpersonen nach verschiedenen Kriterien</li>
                  <li>Export von Kontaktdaten in verschiedene Formate</li>
                  <li>Integration mit gängigen CRM-Systemen (kostenpflichtige Pläne)</li>
                  <li>Verwaltung von Suchergebnissen und Kontakten im integrierten CRM</li>
                  <li>Credit-basiertes Abrechnungssystem</li>
                </ul>
                <p className="pt-2">
                  <strong>3.2 Credits:</strong> Ein Credit entspricht einem verifizierten Kontakt mit
                  vollständigen Kontaktdaten. Credits werden beim Export von Kontakten abgebucht. Nicht
                  genutzte Credits verfallen am Monatsende.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Abonnement- und Preisvereinbarungen</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>4.1 Tarifmodelle:</strong> Die Plattform bietet verschiedene Tarifmodelle an:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Starter:</strong> 100 Credits/Monat, Basis-Funktionen</li>
                  <li><strong>Professional:</strong> 500 Credits/Monat, erweiterte Funktionen und Integrationen</li>
                  <li><strong>Enterprise:</strong> 2.000 Credits/Monat, alle Funktionen plus API-Zugriff</li>
                </ul>
                <p className="pt-2">
                  <strong>4.2 Kostenlose Testphase:</strong> Neue Nutzer erhalten 14 Tage lang Zugang
                  zum Professional-Tarif ohne Angabe einer Kreditkarte. Nach Ablauf der Testphase wird der
                  Account automatisch auf den Free-Tarif zurückgesetzt, sofern kein kostenpflichtiges Abo gewählt wird.
                </p>
                <p>
                  <strong>4.3 Preisanpassungen:</strong> Der Anbieter behält sich vor, die Preise im Rahmen
                  einer Änderungskündigung mit einer Frist von 4 Wochen zum Monatsende anzupassen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Zahlungsbedingungen</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>5.1 Abrechnung:</strong> Kostenpflichtige Abonnements werden monatlich oder
                  jährlich im Voraus in Rechnung gestellt. Die Zahlung erfolgt per Kreditkarte oder
                  SEPA-Lastschrift über den Zahlungsanbieter Stripe.
                </p>
                <p>
                  <strong>5.2 Verzug:</strong> Bei Zahlungsverzug ist der Anbieter berechtigt,
                  Verzugszinsen in Höhe von 5 Prozentpunkten über dem jeweiligen Basiszinssatz zu verlangen.
                  Bei Verzug kann der Anbieter den Zugang zur Plattform vorübergehend sperren.
                </p>
                <p>
                  <strong>5.3 Rückgaberecht:</strong> Aufgrund der digitalen Natur der Dienstleistung
                  besteht kein gesetzliches Widerrufsrecht für bereits genutzte Credits.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Nutzerpflichten und Rechteinhaberschaft</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>6.1 Zulässige Nutzung:</strong> Der Nutzer darf die bereitgestellten
                  Kontaktdaten nur für legitime B2B-Zwecke verwenden. Insbesondere ist untersagt:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Massen-Spam-Marketing oder unerwünschte Kontaktaufnahme</li>
                  <li>Weiterverkauf der Daten an Dritte</li>
                  <li>Verwendung für politische oder religiöse Propaganda</li>
                  <li>Verletzung von Rechten Dritter oder geltenden Gesetzen</li>
                </ul>
                <p className="pt-2">
                  <strong>6.2 Datenqualität:</strong> Der Anbieter übernimmt keine Gewähr für die
                  Aktualität oder Richtigkeit der bereitgestellten Daten. Der Nutzer hat Anspruch auf
                  Erstattung von Credits bei ungültigen Daten (maximal 2% derCredits pro Monat).
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Haftung</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>7.1 Gewährleistung:</strong> Der Anbieter haftet nicht für die Verfügbarkeit,
                  Korrektheit oder Vollständigkeit der bereitgestellten Daten. Die Haftung für
                  leichte Fahrlässigkeit ist ausgeschlossen, soweit keine vertraglichen Hauptpflichten
                  oder Körperschäden betroffen sind.
                </p>
                <p>
                  <strong>7.2 Kein Erfolgsversprechen:</strong> Der Anbieter garantiert nicht, dass
                  die Nutzung der Plattform zu bestimmten geschäftlichen Ergebnissen (z.B. Verkäufen,
                  Leads) führt. Die Erfolgswahrscheinlichkeit hängt von zahlreichen externen Faktoren ab.
                </p>
                <p>
                  <strong>7.3 Haftungsbegrenzung:</strong> Die Haftung des Anbieters ist auf den
                  Rechnungsbetrag des betroffenen Monats begrenzt, soweit gesetzlich zulässig.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">8. Datenschutz und Datensicherheit</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Der Anbieter verarbeitet personenbezogene Daten der Nutzer gemäß den Bestimmungen der
                  DSGVO. Detaillierte Informationen entnehmen Sie bitte unserer Datenschutzerklärung,
                  die unter /datenschutz verfügbar ist.
                </p>
                <p>
                  <strong>Datensicherheit:</strong> Der Anbieter trifft technische und organisatorische
                  Maßnahmen, um die Sicherheit der Daten zu gewährleisten. Dennoch besteht kein
                  hundertprozentiger Schutz vor Hackerangriffen oder anderen Sicherheitsvorfällen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">9. Kündigung und Kontosperrung</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>9.1 Kündigung:</strong> Kostenpflichtige Abonnements können jederzeit zum
                  Ende des laufenden Abrechnungszeitraums gekündigt werden. Die Kündigung erfolgt über
                  das Benutzerkonto oder per E-Mail an support@manyleads.io.
                </p>
                <p>
                  <strong>9.2 Kontosperrung:</strong> Der Anbieter behält sich vor, Benutzerkonten
                  vorübergehend oder dauerhaft zu sperren, wenn:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Der Nutzer gegen diese AGB verstößt</li>
                  <li>Der Nutzer die Plattform für rechtswidrige Zwecke nutzt</li>
                  <li>Zahlungen ausständig bleiben</li>
                  <li>Der Verdacht auf Betrug oder Missbrauch besteht</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">10. Änderungen der AGB</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Der Anbieter behält sich vor, diese AGB jederzeit zu ändern. Änderungen werden den
                  Nutzern mindestens 4 Wochen vor Inkrafttreten per E-Mail oder über die Plattform
                  mitgeteilt. Wenn der Nutzer der Änderung nicht widerspricht, gelten die geänderten
                  AGB als angenommen.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">11. Anwendbares Recht und Gerichtsstand</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des
                  UN-Kaufrechts. Gerichtsstand ist der Sitz des Anbieters, sofern der Nutzer
                  Kaufmann im Sinne des HGB ist oder seinen Sitz im Ausland hat.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">12. Salvatorische Klausel</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  Sollte eine Bestimmung dieser AGB unwirksam sein oder werden, so berührt dies
                  die Wirksamkeit der übrigen Bestimmungen nicht. Die unwirksame Bestimmung ist
                  durch eine wirksame zu ersetzen, die dem wirtschaftlichen Zweck der unwirksamen
                  Bestimmung am nächsten kommt.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">13. Kontakt</h2>
              <div className="space-y-2 text-sm">
                <p>
                  Für Fragen zu diesen AGB steht Ihnen unser Support-Team gerne zur Verfügung:
                </p>
                <p className="pt-2">
                  <strong>E-Mail:</strong> support@manyleads.io
                </p>
                <p>
                  <strong>Stand:</strong> {new Date().toLocaleDateString('de-DE')}
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}