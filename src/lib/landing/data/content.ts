// E12 Landing Page Content Data
// German UI content for all sections

export const siteConfig = {
  name: 'Manyleads',
  tagline: 'B2B Lead-Generation Plattform',
  url: 'https://manyleads.io',
  email: 'support@manyleads.io',
}

// Navigation Links
export const navLinks = {
  main: [
    { label: 'Features', href: '#features' },
    { label: 'Funktionsweise', href: '#how-it-works' },
    { label: 'Preise', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ],
  auth: {
    login: { label: 'Anmelden', href: '/login' },
    register: { label: 'Kostenlos starten', href: '/registrieren' },
  },
}

// Hero Section
export const heroContent = {
  headline: 'Finde qualifizierte B2B-Leads mit KI-gestützter Suche',
  subheadline: 'Durchsuche tausende Unternehmen nach Branche, Standort und Größe. Erhalte verifizierte Kontaktdaten von Entscheidern, die bereit sind zu kaufen.',
  cta: {
    primary: { label: 'Kostenlos starten', href: '/registrieren' },
    secondary: { label: 'Live-Demo ansehen', href: '#demo' },
  },
  trustBadge: {
    text: '14 Tage kostenlos testen',
    subtext: 'Keine Kreditkarte erforderlich',
  },
  stats: [
    { value: '50K+', label: 'Unternehmen' },
    { value: '2.5M+', label: 'Kontaktdaten' },
    { value: '98%', label: 'Verifizierungsrate' },
  ],
}

// Social Proof - Company Logos (placeholder names)
export const socialProofContent = {
  headline: 'Vertraut von führenden Vertriebsteams',
  logos: [
    { name: 'TechCorp', initials: 'TC' },
    { name: 'Innovate GmbH', initials: 'IG' },
    { name: 'ScaleUp AG', initials: 'SA' },
    { name: 'DigitalFirst', initials: 'DF' },
    { name: 'CloudSync', initials: 'CS' },
  ],
  stats: [
    { value: '500+', label: 'Aktive Nutzer' },
    { value: '12K', label: 'Leads/Monat' },
    { value: '4.8', label: 'Durchschnittliche Bewertung' },
  ],
}

// Features Section
export const featuresContent = {
  headline: 'Alles was du für erfolgreichen B2B-Vertrieb brauchst',
  subheadline: 'Von präziser Zielgruppenansprache bis zur nahtlosen CRM-Integration - wir haben die Tools, die dein Vertriebsteam braucht.',
  features: [
    {
      icon: 'Target',
      title: 'Präzise Zielgruppenansprache',
      description: 'Filtere Unternehmen nach Branche, Unternehmensgröße, Standort, Technologie-Stack und vielem mehr. Finde genau die Leads, die zu deinem Ideal Customer Profile passen.',
    },
    {
      icon: 'Zap',
      title: 'Verifizierte Ergebnisse',
      description: 'Unsere KI überprüft jede E-Mail-Adresse und Telefonnummer auf Aktualität. 98% Verifizierungsrate bedeutet weniger Bounces, mehr erfolgreiche Kontakte.',
    },
    {
      icon: 'Database',
      title: 'Umfassende Datentiefe',
      description: 'Zugriff auf über 2,5 Millionen verifizierte Kontaktdaten. Immer aktuell, GDPR-konform und rechtssicher für deinen Vertrieb.',
    },
    {
      icon: 'Plug',
      title: 'Nahtlose Integration',
      description: 'Exportiere Leads direkt in dein CRM - HubSpot, Salesforce, Pipedrive und viele mehr. CSV-Export für alle anderen Systeme verfügbar.',
    },
  ],
}

// How It Works Section
export const howItWorksContent = {
  headline: 'So einfach funktioniert Lead-Generierung',
  subheadline: 'In drei einfachen Schritten zu deinen ersten qualifizierten Leads',
  steps: [
    {
      number: '01',
      title: 'Zielgruppe definieren',
      description: 'Nutze unsere 50+ Filter-Kriterien, um dein Ideal Customer Profile präzise zu definieren. Branche, Standort, Unternehmensgröße, Technologie-Stack - finde genau die Unternehmen, die zu dir passen.',
      icon: 'Search',
    },
    {
      number: '02',
      title: 'Leads generieren',
      description: 'Unsere KI durchsucht in Sekunden unsere Datenbank und liefert dir verifizierte Kontaktdaten von Entscheidern. Jeder Lead wird auf Aktualität geprüft - du erhältst nur qualitativ hochwertige Ergebnisse.',
      icon: 'Sparkles',
    },
    {
      number: '03',
      title: 'Exportieren & Kontaktieren',
      description: 'Exportiere deine Leads mit einem Klick in dein CRM oder als CSV. Starte sofort mit deiner Outreach-Kampagne und verwandle Leads in Kunden.',
      icon: 'Download',
    },
  ],
}

// Pricing Section
export const pricingContent = {
  headline: 'Transparente Preise für jedes Wachstumsstadium',
  subheadline: 'Wähle den Plan, der zu deinem Team passt. Jederzeit upgraden oder downgraden.',
  billing: {
    monthly: 'Monatlich',
    annual: 'Jährlich',
    savings: '10% sparen',
  },
  plans: [
    {
      name: 'Starter',
      description: 'Perfekt für Einsteiger und kleine Teams',
      price: { monthly: 49, annual: 44 },
      features: [
        '100 Credits/Monat',
        'Basis-Suchfilter',
        'CSV-Export',
        'E-Mail-Support',
        '1 Benutzer',
      ],
      cta: { label: 'Starter wählen', href: '/registrieren?plan=starter' },
      popular: false,
    },
    {
      name: 'Professional',
      description: 'Für wachsende Vertriebsteams',
      price: { monthly: 149, annual: 134 },
      features: [
        '500 Credits/Monat',
        'Erweiterte Filter',
        'CRM-Integrationen',
        'Prioritäts-Support',
        '3 Benutzer',
        'API-Zugriff',
      ],
      cta: { label: 'Professional wählen', href: '/registrieren?plan=professional' },
      popular: true,
    },
    {
      name: 'Enterprise',
      description: 'Für große Organisationen',
      price: { monthly: 399, annual: 359 },
      features: [
        '2.000 Credits/Monat',
        'Alle Filter + Custom',
        'Alle Integrationen',
        'Dedizierter Support',
        'Unbegrenzte Benutzer',
        'Erweiterte API',
        'SLA-Garantie',
      ],
      cta: { label: 'Enterprise wählen', href: '/registrieren?plan=enterprise' },
      popular: false,
    },
  ],
  footer: 'Alle Preise inkl. MwSt. 14 Tage kostenlose Testphase für alle Pläne.',
}

// Testimonials Section
export const testimonialsContent = {
  headline: 'Das sagen unsere Kunden',
  subheadline: 'Entdecke, wie Unternehmen mit Manyleads ihre Vertriebsergebnisse verbessern.',
  testimonials: [
    {
      quote: 'Manyleads hat unsere Lead-Generierung revolutioniert. Wir sparen 20 Stunden pro Woche Recherchezeit und die Qualität der Leads ist unglaublich hoch.',
      author: 'Sarah Schmidt',
      role: 'VP Sales',
      company: 'TechCorp GmbH',
      initials: 'SS',
    },
    {
      quote: 'Die Verifizierungsrate von 98% ist kein Marketing-Spruch - wir haben es getestet. Die Datenqualität übertrifft alle anderen Tools, die wir probiert haben.',
      author: 'Michael Weber',
      role: 'Head of Business Development',
      company: 'ScaleUp AG',
      initials: 'MW',
    },
    {
      quote: 'Endlich ein Tool, das versteht, was B2B-Vertrieb braucht. Die Filtermöglichkeiten sind erstklassig und der Support reagiert in Minuten, nicht Tagen.',
      author: 'Laura Meyer',
      role: 'Sales Director',
      company: 'Innovate GmbH',
      initials: 'LM',
    },
    {
      quote: 'Mit Manyleads konnten wir unsere Conversion Rate um 340% steigern. Die Leads sind so präzise, dass fast jeder Kontakt zu einem qualified meeting führt.',
      author: 'Thomas Bauer',
      role: 'CEO',
      company: 'DigitalFirst Solutions',
      initials: 'TB',
    },
  ],
}

// FAQ Section
export const faqContent = {
  headline: 'Häufig gestellte Fragen',
  subheadline: 'Alles, was du über Manyleads wissen musst.',
  faqs: [
    {
      question: 'Was ist ein Credit und wie funktioniert das System?',
      answer: 'Ein Credit entspricht einem verifizierten Lead mit vollständigen Kontaktdaten. Wenn du nach Leads suchst und die Ergebnisse exportierst, wird pro Lead ein Credit abgebucht. Ungenutzte Credits verfallen am Monatsende und werden nicht übertragen.',
    },
    {
      question: 'Wie aktuell sind die Daten in eurer Datenbank?',
      answer: 'Unsere Datenbank wird täglich aktualisiert. Jede E-Mail-Adresse wird vor dem Export erneut auf Aktualität geprüft. Wir erreichen eine Verifizierungsrate von 98%, was Branchenstandard deutlich übertrifft. Bei ungültigen Daten erstatten wir den Credit.',
    },
    {
      question: 'Ist Manyleads DSGVO-konform?',
      answer: 'Ja, vollständig. Alle Daten stammen aus öffentlich zugänglichen Quellen und berechtigtem Interesse nach Art. 6 DSGVO. Wir bieten Dokumentation für dein Impressum und unterstützen bei der Einhaltung aller Datenschutzvorgaben. Unsere Server stehen in Deutschland.',
    },
    {
      question: 'Kann ich Manyleads mit meinem CRM verbinden?',
      answer: 'Ja! Professional und Enterprise Pläne bieten direkte Integrationen mit HubSpot, Salesforce, Pipedrive und anderen gängigen CRM-Systemen. Starter-Nutzer können Leads als CSV exportieren und in ihr CRM importieren.',
    },
    {
      question: 'Wie läuft die kostenlose Testphase ab?',
      answer: 'Nach der Registrierung erhältst du 14 Tage lang Zugriff auf alle Professional-Features ohne Angabe einer Kreditkarte. Du kannst bis zu 50 Leads exportieren. Falls Manyleads nicht überzeugt, endet der Zugang automatisch - keine versteckten Kosten, kein automatisches Upgrade.',
    },
    {
      question: 'Kann ich meinen Plan später ändern?',
      answer: 'Jederzeit! Du kannst deinen Plan monatlich anpassen - upgraden für mehr Credits oder downgraden, wenn du weniger brauchst. Änderungen gelten für den nächsten Abrechnungszeitraum.',
    },
    {
      question: 'Gibt es eine API für Entwickler?',
      answer: 'Ja, ab dem Professional Plan. Unsere REST-API ermöglicht es dir, Lead-Suchen zu automatisieren, Daten in deine Systeme zu integrieren und Workflows zu optimieren. Enterprise-Kunden erhalten erweiterte API-Limits und dedizierten Support.',
    },
    {
      question: 'Was passiert, wenn mir die Credits ausgehen?',
      answer: 'Du erhältst eine Benachrichtigung bei 80% und 100% deines Credit-Limits. Dann hast du drei Optionen: Auf einen höheren Plan upgraden, auf den nächsten Monat warten oder ein Credit-Paket dazubuchen (ab Professional verfügbar).',
    },
  ],
  cta: {
    headline: 'Noch Fragen?',
    text: 'Unser Support-Team antwortet in der Regel innerhalb von 2 Stunden.',
    button: { label: 'Support kontaktieren', href: 'mailto:support@manyleads.io' },
  },
}

// CTA Section (Final Banner)
export const ctaContent = {
  headline: 'Bereit, deinen Vertrieb auf das nächste Level zu heben?',
  subheadline: 'Starte jetzt deine kostenlose 14-Tage-Testphase. Keine Kreditkarte erforderlich.',
  cta: { label: 'Kostenlos starten', href: '/registrieren' },
  secondary: { label: 'Preise ansehen', href: '#pricing' },
}

// Footer
export const footerContent = {
  company: {
    name: 'Manyleads',
    description: 'Die moderne B2B Lead-Generation Plattform für Vertriebsteams, die mehr erreichen wollen.',
  },
  links: {
    product: {
      title: 'Produkt',
      items: [
        { label: 'Features', href: '#features' },
        { label: 'Preise', href: '#pricing' },
        { label: 'API', href: '/docs/api' },
        { label: 'Integrationen', href: '/docs/integrations' },
      ],
    },
    company: {
      title: 'Unternehmen',
      items: [
        { label: 'Über uns', href: '/about' },
        { label: 'Karriere', href: '/careers' },
        { label: 'Blog', href: '/blog' },
        { label: 'Kontakt', href: '/contact' },
      ],
    },
    legal: {
      title: 'Rechtliches',
      items: [
        { label: 'Impressum', href: '/impressum' },
        { label: 'Datenschutz', href: '/datenschutz' },
        { label: 'AGB', href: '/agb' },
      ],
    },
  },
  newsletter: {
    title: 'Newsletter',
    description: 'Tipps für B2B-Vertrieb und Produkt-Updates.',
    placeholder: 'deine@email.de',
    button: 'Abonnieren',
  },
  social: [
    { name: 'LinkedIn', href: 'https://linkedin.com/company/manyleads' },
    { name: 'Twitter', href: 'https://twitter.com/manyleads' },
  ],
  copyright: `© ${new Date().getFullYear()} Manyleads.io - Alle Rechte vorbehalten.`,
}

// SEO Metadata
export const seoContent = {
  title: 'Manyleads - B2B Lead-Generation mit KI-gestützter Suche',
  description: 'Finde qualifizierte B2B-Leads mit präziser Filterung. 2.5M+ verifizierte Kontaktdaten, 98% Verifizierungsrate, DSGVO-konform. 14 Tage kostenlos testen!',
  keywords: 'B2B Leads, Lead-Generation, Vertrieb, Kontaktdaten, KI-Suche, CRM-Integration, Sales Intelligence',
  og: {
    title: 'Manyleads - Die moderne B2B Lead-Generation Plattform',
    description: 'Finde qualifizierte B2B-Leads mit KI-gestützter Suche. 2.5M+ verifizierte Kontaktdaten.',
    image: '/og-image.jpg',
  },
}
