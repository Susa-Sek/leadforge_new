// CRM System Types - Epic E7

// ==================== CONTACT TYPES ====================

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  company: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  notes: string | null;
  source_collection_id: string | null;
  created_at: string;
  updated_at: string;
  tags?: ContactTag[];
  deals?: Deal[];
}

export interface ContactTag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface ContactTagAssignment {
  contact_id: string;
  tag_id: string;
}

export interface Interaction {
  id: string;
  contact_id: string;
  user_id: string;
  type: InteractionType;
  notes: string | null;
  created_at: string;
}

export type InteractionType = 'email' | 'call' | 'meeting' | 'note' | 'task';

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  email: 'E-Mail',
  call: 'Anruf',
  meeting: 'Meeting',
  note: 'Notiz',
  task: 'Aufgabe',
};

export const INTERACTION_TYPE_ICONS: Record<InteractionType, string> = {
  email: 'Mail',
  call: 'Phone',
  meeting: 'Users',
  note: 'FileText',
  task: 'CheckSquare',
};

// ==================== DEAL TYPES ====================

export interface DealStage {
  id: string;
  user_id: string | null;
  name: string;
  order_index: number;
  color: string;
  is_system: boolean;
  is_won_stage: boolean;
  is_lost_stage: boolean;
  created_at: string;
}

export interface Deal {
  id: string;
  user_id: string;
  contact_id: string | null;
  stage_id: string;
  title: string;
  description: string | null;
  value: number | null;
  probability: number | null;
  expected_close_date: string | null;
  actual_close_date: string | null;
  is_won: boolean | null;
  close_reason: string | null;
  created_at: string;
  updated_at: string;
  stage?: DealStage;
  contact?: Contact;
}

// Pipeline Stage with deals for Kanban
export interface PipelineColumn {
  stage: DealStage;
  deals: Deal[];
  totalValue: number;
  count: number;
}

// ==================== API REQUEST/RESPONSE TYPES ====================

export interface CreateContactRequest {
  name: string;
  company: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  tag_ids?: string[];
}

export interface UpdateContactRequest {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  notes?: string;
}

export interface CreateInteractionRequest {
  type: InteractionType;
  notes: string;
}

export interface CreateDealRequest {
  title: string;
  description?: string;
  contact_id?: string;
  stage_id: string;
  value?: number;
  probability?: number;
  expected_close_date?: string;
}

export interface UpdateDealRequest {
  title?: string;
  description?: string;
  contact_id?: string | null;
  stage_id?: string;
  value?: number;
  probability?: number;
  expected_close_date?: string;
  actual_close_date?: string;
  is_won?: boolean;
  close_reason?: string;
}

export interface UpdateDealStageRequest {
  stage_id: string;
  is_won?: boolean;
  close_reason?: string;
  actual_close_date?: string;
}

export interface CreateTagRequest {
  name: string;
  color: string;
}

export interface ImportContactsRequest {
  collection_id: string;
  lead_ids: string[];
  tag_ids?: string[];
}

// ==================== FILTER TYPES ====================

export interface ContactFilters {
  search?: string;
  tag_ids?: string[];
  sort_by?: 'name' | 'company' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface DealFilters {
  stage_ids?: string[];
  contact_id?: string;
  min_value?: number;
  max_value?: number;
  min_probability?: number;
  max_probability?: number;
  date_from?: string;
  date_to?: string;
  is_open?: boolean;
  sort_by?: 'value' | 'probability' | 'expected_close_date' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

// ==================== STATS TYPES ====================

export interface PipelineStats {
  totalValue: number;
  weightedValue: number;
  openDeals: number;
  avgProbability: number;
  winRate: number | null;
  avgDealSize: number;
  closedThisMonth: number;
  wonThisMonth: number;
  lostThisMonth: number;
}

export interface StageStats {
  stage_id: string;
  stage_name: string;
  count: number;
  total_value: number;
  color: string;
}

// ==================== PLAN LIMITS ====================

export interface PlanLimits {
  maxContacts: number;
  maxTags: number;
  maxDeals: number;
  maxNotesLength: number;
  maxInteractions: number;
  canImport: boolean;
  canBulkActions: boolean;
  canExport: boolean;
  canUseKanban: boolean;
  canDragDrop: boolean;
  canUseTagManager: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: {
    maxContacts: 50,
    maxTags: 5,
    maxDeals: 10,
    maxNotesLength: 5000,
    maxInteractions: 10,
    canImport: false,
    canBulkActions: false,
    canExport: false,
    canUseKanban: false,
    canDragDrop: false,
    canUseTagManager: false,
  },
  pro: {
    maxContacts: 500,
    maxTags: 20,
    maxDeals: 100,
    maxNotesLength: 10000,
    maxInteractions: 50,
    canImport: true,
    canBulkActions: true,
    canExport: true,
    canUseKanban: true,
    canDragDrop: true,
    canUseTagManager: true,
  },
  enterprise: {
    maxContacts: Infinity,
    maxTags: Infinity,
    maxDeals: Infinity,
    maxNotesLength: Infinity,
    maxInteractions: Infinity,
    canImport: true,
    canBulkActions: true,
    canExport: true,
    canUseKanban: true,
    canDragDrop: true,
    canUseTagManager: true,
  },
};

// ==================== CLOSE REASONS ====================

export const CLOSE_REASONS = [
  { value: 'too_expensive', label: 'Zu teuer' },
  { value: 'timing', label: 'Falsches Timing' },
  { value: 'competitor', label: 'Konkurrenz gewonnen' },
  { value: 'budget', label: 'Kein Budget' },
  { value: 'not_interested', label: 'Kein Interesse' },
  { value: 'other', label: 'Sonstiges' },
] as const;
