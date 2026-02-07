// Search Types and Interfaces

/**
 * Calculate credit cost for search based on parameters
 * Client-safe version (no server imports)
 *
 * @param maxResults - Maximum results requested
 * @returns Credit cost (1 credit per 10 results, min 1)
 */
export function calculateSearchCost(maxResults: number): number {
  if (!maxResults || maxResults <= 0) {
    return 1
  }
  // 1 credit per 10 results, minimum 1 credit
  return Math.max(1, Math.ceil(maxResults / 10))
}

// Search parameters for starting a new search
export interface SearchParams {
  branche: string
  standort: string
  maxResults: number
}

// API Response for starting a search
export interface StartSearchResponse {
  success: boolean
  searchId?: string
  status?: 'pending' | 'processing' | 'cached'
  creditsCost?: number
  creditsRemaining?: number
  message?: string
  error?: string
  code?: 'INSUFFICIENT_CREDITS' | 'VALIDATION_ERROR' | 'RATE_LIMIT' | 'PLAN_LIMIT' | 'UNAUTHORIZED' | 'SERVER_ERROR'
}

// Progress information
export interface SearchProgress {
  percent: number
  currentStep: number
  totalSteps: number
  stepName: string
  leadsFound: number
  leadsExpected: number
}

// Search status from API
export type SearchStatus =
  | 'pending'
  | 'validating'
  | 'searching'
  | 'extracting'
  | 'enriching'
  | 'deduplicating'
  | 'completed'
  | 'failed'
  | 'cancelled'

// API Response for search status
export interface SearchStatusResponse {
  searchId: string
  status: SearchStatus
  progress: SearchProgress
  results?: {
    leads: SearchResultLead[]
    totalCount: number
    uniqueCount: number
  }
  error?: {
    message: string
    code: string
    retryable: boolean
  }
  timestamps: {
    started: string
    updated: string
    completed?: string
  }
}

// Individual lead result
export interface SearchResultLead {
  id: string
  companyName: string
  address: string
  phone?: string
  email?: string
  website?: string
  googleMapsUrl: string
  rating?: number
  reviewsCount?: number
  category?: string
  contactPerson?: string
  socialLinks?: {
    facebook?: string
    instagram?: string
    linkedin?: string
    twitter?: string
    youtube?: string
  }
  openingHours?: Record<string, string>
  imageUrl?: string
}

// Search step definition for UI
export interface SearchStep {
  number: number
  name: string
  icon: string // Lucide icon name
  description: string
}

// The 6 defined search steps
export const SEARCH_STEPS: SearchStep[] = [
  {
    number: 1,
    name: 'Validierung',
    icon: 'CheckCircle',
    description: 'Suchparameter werden validiert',
  },
  {
    number: 2,
    name: 'Suche gestartet',
    icon: 'Search',
    description: 'Apify Actor wird gestartet',
  },
  {
    number: 3,
    name: 'Daten extrahiert',
    icon: 'Database',
    description: 'Unternehmensdaten werden gesammelt',
  },
  {
    number: 4,
    name: 'Kontakte angereichert',
    icon: 'Users',
    description: 'E-Mails und Kontakte werden ermittelt',
  },
  {
    number: 5,
    name: 'Duplikate entfernt',
    icon: 'Filter',
    description: 'Doppelte Einträge werden bereinigt',
  },
  {
    number: 6,
    name: 'Ergebnisse bereit',
    icon: 'CheckCircle2',
    description: 'Leads stehen zur Verfügung',
  },
]

// Industry options for dropdown
export const INDUSTRY_OPTIONS = [
  { value: '', label: 'Branche auswählen...' },
  { value: 'IT & Software', label: 'IT & Software' },
  { value: 'Marketing & Werbung', label: 'Marketing & Werbung' },
  { value: 'Beratung & Consulting', label: 'Beratung & Consulting' },
  { value: 'Produktion & Fertigung', label: 'Produktion & Fertigung' },
  { value: 'Handel & E-Commerce', label: 'Handel & E-Commerce' },
  { value: 'Finanzen & Versicherungen', label: 'Finanzen & Versicherungen' },
  { value: 'Gesundheit & Medizin', label: 'Gesundheit & Medizin' },
  { value: 'Rechtsdienstleistungen', label: 'Rechtsdienstleistungen' },
  { value: 'Steuerberatung', label: 'Steuerberatung' },
  { value: 'Immobilien', label: 'Immobilien' },
  { value: 'Bau & Handwerk', label: 'Bau & Handwerk' },
  { value: 'Logistik & Transport', label: 'Logistik & Transport' },
  { value: 'Gastronomie & Hotellerie', label: 'Gastronomie & Hotellerie' },
  { value: 'Bildung & Training', label: 'Bildung & Training' },
  { value: 'Energie & Umwelt', label: 'Energie & Umwelt' },
]

// German cities for autocomplete
export const GERMAN_CITIES = [
  'Berlin',
  'Hamburg',
  'München',
  'Köln',
  'Frankfurt',
  'Stuttgart',
  'Düsseldorf',
  'Leipzig',
  'Dortmund',
  'Essen',
  'Bremen',
  'Dresden',
  'Hannover',
  'Nürnberg',
  'Duisburg',
  'Bochum',
  'Wuppertal',
  'Bielefeld',
  'Bonn',
  'Münster',
  'Karlsruhe',
  'Mannheim',
  'Augsburg',
  'Wiesbaden',
  'Gelsenkirchen',
  'Mönchengladbach',
  'Braunschweig',
  'Chemnitz',
  'Kiel',
  'Aachen',
  'Halle (Saale)',
  'Magdeburg',
  'Freiburg',
  'Krefeld',
  'Lübeck',
  'Oberhausen',
  'Erfurt',
  'Mainz',
  'Rostock',
  'Kassel',
  'Hagen',
  'Hamm',
  'Saarbrücken',
  'Mülheim',
  'Potsdam',
  'Ludwigshafen',
  'Oldenburg',
  'Leverkusen',
  'Osnabrück',
  'Solingen',
  'Heidelberg',
  'Herne',
  'Neuss',
  'Darmstadt',
  'Paderborn',
  'Regensburg',
  'Ingolstadt',
  'Würzburg',
  'Fürth',
  'Wolfsburg',
  'Offenbach',
  'Ulm',
  'Heilbronn',
  'Pforzheim',
  'Göttingen',
  'Bottrop',
  'Trier',
  'Recklinghausen',
  'Reutlingen',
  'Bremerhaven',
  'Koblenz',
  'Bergisch Gladbach',
  'Jena',
  'Remscheid',
  'Erlangen',
  'Moers',
]
