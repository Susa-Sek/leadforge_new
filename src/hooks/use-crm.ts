// SWR Hooks for CRM System - Epic E7
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
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
} from '@/lib/crm/types';
import * as api from '@/lib/crm/api';

// Main CRM hook that combines all CRM functionality
export function useCrm() {
  return {
    // Contacts
    useContacts,
    useContact,
    useCreateContact,
    useUpdateContact,
    useDeleteContact,
    // Tags
    useTags,
    useCreateTag,
    useUpdateTag,
    useDeleteTag,
    // Interactions
    useInteractions,
    useCreateInteraction,
    // Deals
    useDeals,
    useDeal,
    useCreateDeal,
    useUpdateDeal,
    useUpdateDealStage,
    useDeleteDeal,
    // Pipeline
    usePipeline,
    useDealStages,
    // Import
    useImportContacts,
  };
}

// ==================== CONTACTS ====================

export function useContacts(filters: ContactFilters = {}) {
  const key = ['contacts', filters];
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => api.fetchContacts(filters),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    contacts: data?.contacts ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    limit: data?.limit ?? 20,
    isLoading,
    error,
    mutate,
  };
}

export function useContact(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ['contact', id] : null,
    () => (id ? api.fetchContact(id) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    contact: data,
    isLoading,
    error,
    mutate,
  };
}

export function useCreateContact() {
  return useSWRMutation(
    'contacts',
    async (_, { arg }: { arg: CreateContactRequest }) => {
      return api.createContact(arg);
    }
  );
}

export function useUpdateContact(id: string) {
  return useSWRMutation(
    ['contact', id],
    async (_, { arg }: { arg: UpdateContactRequest }) => {
      return api.updateContact(id, arg);
    }
  );
}

export function useDeleteContact() {
  return useSWRMutation(
    'contacts',
    async (_, { arg }: { arg: string }) => {
      return api.deleteContact(arg);
    }
  );
}

export function useUpdateContactNotes(id: string) {
  return useSWRMutation(
    ['contact', id, 'notes'],
    async (_, { arg }: { arg: string }) => {
      return api.updateContactNotes(id, arg);
    }
  );
}

// ==================== TAGS ====================

export function useTags() {
  const { data, error, isLoading, mutate } = useSWR(
    'tags',
    api.fetchTags,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    tags: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useCreateTag() {
  return useSWRMutation(
    'tags',
    async (_, { arg }: { arg: CreateTagRequest }) => {
      return api.createTag(arg);
    }
  );
}

export function useUpdateTag(id: string) {
  return useSWRMutation(
    'tags',
    async (_, { arg }: { arg: CreateTagRequest }) => {
      return api.updateTag(id, arg);
    }
  );
}

export function useDeleteTag() {
  return useSWRMutation(
    'tags',
    async (_, { arg }: { arg: string }) => {
      return api.deleteTag(arg);
    }
  );
}

export function useAssignTagToContact(contactId: string) {
  return useSWRMutation(
    ['contact', contactId, 'tags'],
    async (_, { arg }: { arg: string }) => {
      return api.assignTagToContact(contactId, arg);
    }
  );
}

export function useRemoveTagFromContact(contactId: string) {
  return useSWRMutation(
    ['contact', contactId, 'tags'],
    async (_, { arg }: { arg: string }) => {
      return api.removeTagFromContact(contactId, arg);
    }
  );
}

// ==================== INTERACTIONS ====================

export function useInteractions(contactId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    contactId ? ['interactions', contactId] : null,
    () => (contactId ? api.fetchInteractions(contactId) : []),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    interactions: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useCreateInteraction(contactId: string) {
  return useSWRMutation(
    ['interactions', contactId],
    async (_, { arg }: { arg: CreateInteractionRequest }) => {
      return api.createInteraction(contactId, arg);
    }
  );
}

export function useDeleteInteraction(contactId: string) {
  return useSWRMutation(
    ['interactions', contactId],
    async (_, { arg }: { arg: string }) => {
      return api.deleteInteraction(contactId, arg);
    }
  );
}

// ==================== DEALS ====================

export function useDeals(filters: DealFilters = {}) {
  const { data, error, isLoading, mutate } = useSWR(
    ['deals', filters],
    () => api.fetchDeals(filters),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    deals: data?.deals ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

export function useDeal(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ['deal', id] : null,
    () => (id ? api.fetchDeal(id) : null),
    {
      revalidateOnFocus: false,
    }
  );

  return {
    deal: data,
    isLoading,
    error,
    mutate,
  };
}

export function useCreateDeal() {
  return useSWRMutation(
    'deals',
    async (_, { arg }: { arg: CreateDealRequest }) => {
      return api.createDeal(arg);
    }
  );
}

export function useUpdateDeal(id: string) {
  return useSWRMutation(
    ['deal', id],
    async (_, { arg }: { arg: UpdateDealRequest }) => {
      return api.updateDeal(id, arg);
    }
  );
}

// BUG FIX: useUpdateDealStage now returns a trigger function that accepts both
// the deal ID and the update data, allowing proper cache invalidation for all related keys
export function useUpdateDealStage() {
  const { mutate: mutatePipeline } = useSWR('pipeline');
  const { mutate: mutateDeals } = useSWR('deals');

  return useSWRMutation(
    'update-deal-stage',
    async (_, { arg }: { arg: { dealId: string; data: UpdateDealStageRequest } }) => {
      const result = await api.updateDealStage(arg.dealId, arg.data);
      // Invalidate all related caches after successful update
      await mutatePipeline();
      await mutateDeals();
      return result;
    }
  );
}

export function useDeleteDeal() {
  return useSWRMutation(
    'deals',
    async (_, { arg }: { arg: string }) => {
      return api.deleteDeal(arg);
    }
  );
}

// ==================== DEAL STAGES ====================

export function useDealStages() {
  const { data, error, isLoading } = useSWR(
    'deal-stages',
    api.fetchDealStages,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    stages: data ?? [],
    isLoading,
    error,
  };
}

// ==================== PIPELINE ====================

export function usePipeline() {
  const { data, error, isLoading, mutate } = useSWR(
    'pipeline',
    api.fetchPipeline,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    columns: data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function usePipelineStats() {
  const { data, error, isLoading } = useSWR(
    'pipeline-stats',
    api.fetchPipelineStats,
    {
      revalidateOnFocus: false,
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  return {
    stats: data,
    isLoading,
    error,
  };
}

// ==================== IMPORT/EXPORT ====================

export function useImportContacts() {
  return useSWRMutation(
    'contacts',
    async (_, { arg }: { arg: ImportContactsRequest }) => {
      return api.importContacts(arg);
    }
  );
}

// ==================== COUNTS ====================

export function useContactCount() {
  const { data, error } = useSWR(
    'contact-count',
    api.fetchContactCount,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    count: data ?? 0,
    error,
  };
}

export function useDealCount() {
  const { data, error } = useSWR(
    'deal-count',
    api.fetchDealCount,
    {
      revalidateOnFocus: false,
    }
  );

  return {
    count: data ?? 0,
    error,
  };
}
