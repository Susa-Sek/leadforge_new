// CRM API Functions - Epic E7
import type {
  Contact,
  ContactTag,
  Interaction,
  Deal,
  DealStage,
  PipelineColumn,
  CreateContactRequest,
  UpdateContactRequest,
  CreateInteractionRequest,
  CreateDealRequest,
  UpdateDealRequest,
  UpdateDealStageRequest,
  CreateTagRequest,
  ImportContactsRequest,
  ContactFilters,
  DealFilters,
  PipelineStats,
  StageStats,
} from './types';

// ==================== CONTACTS ====================

export async function fetchContacts(filters: ContactFilters = {}): Promise<{
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
}> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.tag_ids?.length) params.set('tag_ids', filters.tag_ids.join(','));
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_order) params.set('sort_order', filters.sort_order);
  if (filters.page) params.set('page', filters.page.toString());
  if (filters.limit) params.set('limit', filters.limit.toString());

  const response = await fetch(`/api/contacts?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch contacts');
  return response.json();
}

export async function fetchContact(id: string): Promise<Contact> {
  const response = await fetch(`/api/contacts/${id}`);
  if (!response.ok) throw new Error('Failed to fetch contact');
  return response.json();
}

export async function createContact(data: CreateContactRequest): Promise<Contact> {
  const response = await fetch('/api/contacts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create contact');
  }
  return response.json();
}

export async function updateContact(id: string, data: UpdateContactRequest): Promise<Contact> {
  const response = await fetch(`/api/contacts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update contact');
  }
  return response.json();
}

export async function deleteContact(id: string): Promise<void> {
  const response = await fetch(`/api/contacts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete contact');
}

export async function updateContactNotes(id: string, notes: string): Promise<void> {
  const response = await fetch(`/api/contacts/${id}/notes`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  });
  if (!response.ok) throw new Error('Failed to update notes');
}

// ==================== CONTACT TAGS ====================

export async function fetchTags(): Promise<ContactTag[]> {
  const response = await fetch('/api/contact-tags');
  if (!response.ok) throw new Error('Failed to fetch tags');
  return response.json();
}

export async function createTag(data: CreateTagRequest): Promise<ContactTag> {
  const response = await fetch('/api/contact-tags', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create tag');
  }
  return response.json();
}

export async function updateTag(id: string, data: CreateTagRequest): Promise<ContactTag> {
  const response = await fetch(`/api/contact-tags/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update tag');
  return response.json();
}

export async function deleteTag(id: string): Promise<void> {
  const response = await fetch(`/api/contact-tags/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete tag');
}

export async function assignTagToContact(contactId: string, tagId: string): Promise<void> {
  const response = await fetch(`/api/contacts/${contactId}/tags`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_id: tagId }),
  });
  if (!response.ok) throw new Error('Failed to assign tag');
}

export async function removeTagFromContact(contactId: string, tagId: string): Promise<void> {
  const response = await fetch(`/api/contacts/${contactId}/tags/${tagId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to remove tag');
}

// ==================== INTERACTIONS ====================

export async function fetchInteractions(contactId: string): Promise<Interaction[]> {
  const response = await fetch(`/api/contacts/${contactId}/interactions`);
  if (!response.ok) throw new Error('Failed to fetch interactions');
  return response.json();
}

export async function createInteraction(
  contactId: string,
  data: CreateInteractionRequest
): Promise<Interaction> {
  const response = await fetch(`/api/contacts/${contactId}/interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create interaction');
  }
  return response.json();
}

export async function deleteInteraction(contactId: string, interactionId: string): Promise<void> {
  const response = await fetch(`/api/contacts/${contactId}/interactions/${interactionId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete interaction');
}

// ==================== DEALS ====================

export async function fetchDeals(filters: DealFilters = {}): Promise<{
  deals: Deal[];
  total: number;
}> {
  const params = new URLSearchParams();
  if (filters.stage_ids?.length) params.set('stage_ids', filters.stage_ids.join(','));
  if (filters.contact_id) params.set('contact_id', filters.contact_id);
  if (filters.min_value !== undefined) params.set('min_value', filters.min_value.toString());
  if (filters.max_value !== undefined) params.set('max_value', filters.max_value.toString());
  if (filters.min_probability !== undefined) params.set('min_probability', filters.min_probability.toString());
  if (filters.max_probability !== undefined) params.set('max_probability', filters.max_probability.toString());
  if (filters.date_from) params.set('date_from', filters.date_from);
  if (filters.date_to) params.set('date_to', filters.date_to);
  if (filters.is_open !== undefined) params.set('is_open', filters.is_open.toString());
  if (filters.sort_by) params.set('sort_by', filters.sort_by);
  if (filters.sort_order) params.set('sort_order', filters.sort_order);

  const response = await fetch(`/api/deals?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch deals');
  return response.json();
}

export async function fetchDeal(id: string): Promise<Deal> {
  const response = await fetch(`/api/deals/${id}`);
  if (!response.ok) throw new Error('Failed to fetch deal');
  return response.json();
}

export async function createDeal(data: CreateDealRequest): Promise<Deal> {
  const response = await fetch('/api/deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create deal');
  }
  return response.json();
}

export async function updateDeal(id: string, data: UpdateDealRequest): Promise<Deal> {
  const response = await fetch(`/api/deals/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update deal');
  }
  return response.json();
}

export async function updateDealStage(id: string, data: UpdateDealStageRequest): Promise<Deal> {
  const response = await fetch(`/api/deals/${id}/stage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update deal stage');
  }
  return response.json();
}

export async function deleteDeal(id: string): Promise<void> {
  const response = await fetch(`/api/deals/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete deal');
}

// ==================== DEAL STAGES ====================

export async function fetchDealStages(): Promise<DealStage[]> {
  const response = await fetch('/api/deal-stages');
  if (!response.ok) throw new Error('Failed to fetch deal stages');
  return response.json();
}

// ==================== PIPELINE ====================

export async function fetchPipeline(): Promise<PipelineColumn[]> {
  const response = await fetch('/api/deals/pipeline');
  if (!response.ok) throw new Error('Failed to fetch pipeline');
  return response.json();
}

export async function fetchPipelineStats(): Promise<PipelineStats> {
  const response = await fetch('/api/deals/stats');
  if (!response.ok) throw new Error('Failed to fetch pipeline stats');
  return response.json();
}

export async function fetchStageStats(): Promise<StageStats[]> {
  const response = await fetch('/api/deals/stage-stats');
  if (!response.ok) throw new Error('Failed to fetch stage stats');
  return response.json();
}

// ==================== IMPORT/EXPORT ====================

export async function importContacts(data: ImportContactsRequest): Promise<{
  imported: number;
  duplicates: number;
  errors: number;
}> {
  const response = await fetch('/api/contacts/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to import contacts');
  }
  return response.json();
}

export async function exportContacts(contactIds?: string[]): Promise<Blob> {
  const response = await fetch('/api/contacts/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact_ids: contactIds }),
  });
  if (!response.ok) throw new Error('Failed to export contacts');
  return response.blob();
}

export async function exportDeals(dealIds?: string[]): Promise<Blob> {
  const response = await fetch('/api/deals/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deal_ids: dealIds }),
  });
  if (!response.ok) throw new Error('Failed to export deals');
  return response.blob();
}

// ==================== COUNTS ====================

export async function fetchContactCount(): Promise<number> {
  const response = await fetch('/api/contacts/count');
  if (!response.ok) throw new Error('Failed to fetch contact count');
  const data = await response.json();
  return data.count;
}

export async function fetchDealCount(): Promise<number> {
  const response = await fetch('/api/deals/count');
  if (!response.ok) throw new Error('Failed to fetch deal count');
  const data = await response.json();
  return data.count;
}
