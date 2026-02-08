// Zod Schemas for CRM Forms - Epic E7
import * as z from 'zod';

// ==================== CONTACT SCHEMAS ====================

export const contactSchema = z.object({
  name: z.string()
    .min(1, 'Name ist erforderlich')
    .max(100, 'Name darf maximal 100 Zeichen haben'),
  company: z.string()
    .min(1, 'Firma ist erforderlich')
    .max(100, 'Firma darf maximal 100 Zeichen haben'),
  email: z.string()
    .email('Ungültige E-Mail-Adresse')
    .optional()
    .or(z.literal('')),
  phone: z.string()
    .max(50, 'Telefon darf maximal 50 Zeichen haben')
    .optional()
    .or(z.literal('')),
  address: z.string()
    .max(200, 'Adresse darf maximal 200 Zeichen haben')
    .optional()
    .or(z.literal('')),
  website: z.string()
    .max(200, 'Website darf maximal 200 Zeichen haben')
    .transform((val) => {
      if (!val || val === '') return '';
      if (val && !val.startsWith('http://') && !val.startsWith('https://') && val.includes('.')) {
        return `https://${val}`;
      }
      return val;
    })
    .refine(
      (val) => {
        if (!val || val === '') return true;
        try {
          new URL(val);
          return true;
        } catch {
          return val.includes('.');
        }
      },
      { message: 'Ungültige Website-URL (z.B. example.com oder https://example.com)' }
    )
    .optional()
    .or(z.literal('')),
  tag_ids: z.array(z.string()).optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// ==================== TAG SCHEMAS ====================

export const tagSchema = z.object({
  name: z.string()
    .min(1, 'Tag-Name ist erforderlich')
    .max(30, 'Tag-Name darf maximal 30 Zeichen haben')
    .regex(/^[a-zA-Z0-9\-_\s]+$/, 'Nur Buchstaben, Zahlen, Bindestriche und Unterstriche erlaubt'),
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Ungültiger Farbcode (z.B. #3B82F6)'),
});

export type TagFormData = z.infer<typeof tagSchema>;

// ==================== INTERACTION SCHEMAS ====================

export const interactionSchema = z.object({
  type: z.enum(['email', 'call', 'meeting', 'note', 'task']),
  notes: z.string()
    .max(5000, 'Notizen dürfen maximal 5000 Zeichen haben')
    .optional()
    .or(z.literal('')),
});

export type InteractionFormData = z.infer<typeof interactionSchema>;

// ==================== DEAL SCHEMAS ====================

export const dealSchema = z.object({
  title: z.string()
    .min(1, 'Titel ist erforderlich')
    .max(100, 'Titel darf maximal 100 Zeichen haben'),
  description: z.string()
    .max(5000, 'Beschreibung darf maximal 5000 Zeichen haben')
    .optional()
    .or(z.literal('')),
  contact_id: z.string().optional().nullable(),
  stage_id: z.string().min(1, 'Stage ist erforderlich'),
  value: z.number()
    .min(0, 'Wert muss positiv sein')
    .max(100000000, 'Wert ist zu hoch')
    .optional()
    .nullable(),
  probability: z.number()
    .min(0, 'Wahrscheinlichkeit muss zwischen 0 und 100 sein')
    .max(100, 'Wahrscheinlichkeit muss zwischen 0 und 100 sein')
    .optional()
    .nullable(),
  expected_close_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum (YYYY-MM-DD)')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export type DealFormData = z.infer<typeof dealSchema>;

// ==================== DEAL CLOSE SCHEMAS ====================

export const dealCloseSchema = z.object({
  is_won: z.boolean(),
  actual_close_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum')
    .optional()
    .nullable(),
  close_reason: z.string()
    .max(500, 'Grund darf maximal 500 Zeichen haben')
    .optional()
    .nullable(),
});

export type DealCloseFormData = z.infer<typeof dealCloseSchema>;

// ==================== IMPORT SCHEMAS ====================

export const importSchema = z.object({
  collection_id: z.string().min(1, 'Sammlung ist erforderlich'),
  lead_ids: z.array(z.string()).min(1, 'Mindestens ein Lead auswählen'),
  tag_ids: z.array(z.string()).optional(),
});

export type ImportFormData = z.infer<typeof importSchema>;

// ==================== CLOSE REASONS ====================

export const CLOSE_REASONS = [
  { value: 'too_expensive', label: 'Zu teuer' },
  { value: 'timing', label: 'Falsches Timing' },
  { value: 'competitor', label: 'Konkurrenz gewonnen' },
  { value: 'budget', label: 'Kein Budget' },
  { value: 'not_interested', label: 'Kein Interesse' },
  { value: 'other', label: 'Sonstiges' },
] as const;

// ==================== DEFAULT VALUES ====================

export const defaultContactValues: Partial<ContactFormData> = {
  name: '',
  company: '',
  email: '',
  phone: '',
  address: '',
  website: '',
  tag_ids: [],
};

export const defaultTagValues: Partial<TagFormData> = {
  name: '',
  color: '#3B82F6',
};

export const defaultInteractionValues: Partial<InteractionFormData> = {
  type: 'note',
  notes: '',
};

export const defaultDealValues: Partial<DealFormData> = {
  title: '',
  description: '',
  contact_id: null,
  stage_id: '',
  value: null,
  probability: 25,
  expected_close_date: null,
};

// ==================== TAG COLORS ====================

export const TAG_COLOR_OPTIONS = [
  { value: '#3B82F6', label: 'Blau' },
  { value: '#EF4444', label: 'Rot' },
  { value: '#10B981', label: 'Grün' },
  { value: '#F59E0B', label: 'Gelb' },
  { value: '#8B5CF6', label: 'Lila' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#6B7280', label: 'Grau' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#F97316', label: 'Orange' },
  { value: '#6366F1', label: 'Indigo' },
];

// ==================== STAGE DEFAULT PROBABILITIES ====================

export const STAGE_DEFAULT_PROBABILITIES: Record<string, number> = {
  'Lead': 10,
  'Kontaktiert': 25,
  'Qualifiziert': 50,
  'Angebot': 75,
  'Geschlossen (Gewonnen)': 100,
  'Geschlossen (Verloren)': 0,
};
