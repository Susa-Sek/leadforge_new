/**
 * Export Hooks
 *
 * React hooks for managing exports, templates, and scheduled exports.
 * Provides functionality for starting exports, polling status, and managing templates.
 *
 * @module useExport
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import {
  ExportType,
  ExportFormat,
  ExportStatus,
  ExportContactsRequest,
  ExportDealsRequest,
  ExportLeadsRequest,
  CreateTemplateRequest,
  CreateScheduledExportRequest,
  ExportResponse,
  ExportStatusResponse,
  ExportHistoryItem,
  TemplateResponse,
  ScheduledExportResponse,
} from '@/lib/export/types';

// Constants
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_TIME = 5 * 60 * 1000; // 5 minutes

// Generic fetcher
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  return response.json();
};

/**
 * Hook for starting and managing an export
 *
 * @returns Export controls and state
 *
 * @example
 * ```tsx
 * const { startExport, isLoading, error, exportData } = useExport();
 *
 * const handleExport = () => {
 *   startExport('contacts', {
 *     format: 'csv',
 *     columns: ['name', 'email'],
 *   });
 * };
 * ```
 */
export function useExport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportData, setExportData] = useState<ExportResponse | null>(null);

  const startExport = useCallback(async (
    type: ExportType,
    request: ExportContactsRequest | ExportDealsRequest | ExportLeadsRequest
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = `/api/export/${type}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Export failed');
      }

      setExportData(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setExportData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    startExport,
    isLoading,
    error,
    exportData,
    reset,
  };
}

/**
 * Hook for polling export status
 *
 * Automatically polls while status is pending or processing
 *
 * @param exportId - The export ID to poll (null to disable)
 * @returns Current status and progress
 *
 * @example
 * ```tsx
 * const { status, progress, downloadUrl, isComplete } = useExportStatus(exportId);
 * ```
 */
export function useExportStatus(exportId: string | null) {
  const [status, setStatus] = useState<ExportStatus | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [rowCount, setRowCount] = useState<number>(0);
  const [processedRows, setProcessedRows] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  const startTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async () => {
    if (!exportId) return;

    // Check max poll time
    if (Date.now() - startTimeRef.current > MAX_POLL_TIME) {
      setIsFailed(true);
      setErrorMessage('Export timeout - please check your export history');
      stopPolling();
      return;
    }

    try {
      const response = await fetch(`/api/export/status/${exportId}`);
      const data: ExportStatusResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.errorMessage || 'Failed to fetch status');
      }

      setStatus(data.status);
      setProgress(data.progress || 0);
      setRowCount(data.rowCount || 0);
      setProcessedRows(data.processedRows || 0);
      setFileName(data.fileName || null);
      setFileSize(data.fileSize || 0);

      if (data.status === 'completed') {
        setDownloadUrl(data.downloadUrl || null);
        setIsComplete(true);
        stopPolling();
        // Refresh history cache
        mutate('/api/export/history');
      } else if (data.status === 'failed' || data.status === 'cancelled' || data.status === 'expired') {
        setErrorMessage(data.errorMessage || `Export ${data.status}`);
        setIsFailed(true);
        stopPolling();
      } else {
        // Continue polling
        timeoutRef.current = setTimeout(pollStatus, POLL_INTERVAL);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Polling failed');
      // Retry on error
      timeoutRef.current = setTimeout(pollStatus, POLL_INTERVAL);
    }
  }, [exportId, stopPolling]);

  const cancelExport = useCallback(async () => {
    if (!exportId) return;

    try {
      const response = await fetch(`/api/export/cancel/${exportId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel export');
      }

      stopPolling();
      setStatus('cancelled');
      setIsFailed(true);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Cancel failed');
    }
  }, [exportId, stopPolling]);

  useEffect(() => {
    if (exportId) {
      startTimeRef.current = Date.now();
      setIsComplete(false);
      setIsFailed(false);
      setErrorMessage(null);
      pollStatus();
    }

    return () => {
      stopPolling();
    };
  }, [exportId, pollStatus, stopPolling]);

  return {
    status,
    progress,
    rowCount,
    processedRows,
    downloadUrl,
    fileName,
    fileSize,
    errorMessage,
    isComplete,
    isFailed,
    isPending: status === 'pending' || status === 'processing',
    cancelExport,
  };
}

/**
 * Hook for fetching export history
 *
 * @param options - Optional filters and pagination
 * @returns Export history list
 *
 * @example
 * ```tsx
 * const { history, isLoading, error, refresh } = useExportHistory({ limit: 50 });
 * ```
 */
export function useExportHistory(options?: { limit?: number; type?: ExportType; status?: ExportStatus }) {
  const queryParams = new URLSearchParams();
  if (options?.limit) queryParams.set('limit', String(options.limit));
  if (options?.type) queryParams.set('type', options.type);
  if (options?.status) queryParams.set('status', options.status);

  const url = `/api/export/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  const { data, error, isLoading, mutate: refresh } = useSWR<{ history: ExportHistoryItem[] }>(
    url,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  const deleteExport = useCallback(async (exportId: string) => {
    try {
      const response = await fetch(`/api/export/history/${exportId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete export');
      }

      // Refresh the list
      refresh();
      return true;
    } catch (err) {
      return false;
    }
  }, [refresh]);

  return {
    history: data?.history || [],
    isLoading,
    error: error?.message || null,
    refresh,
    deleteExport,
  };
}

/**
 * Hook for managing export templates
 *
 * @returns Template CRUD operations
 *
 * @example
 * ```tsx
 * const { templates, createTemplate, deleteTemplate, isLoading } = useExportTemplates();
 * ```
 */
export function useExportTemplates() {
  const { data, error, isLoading, mutate: refresh } = useSWR<{ templates: TemplateResponse[]; count: number }>(
    '/api/export/templates',
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  const createTemplate = useCallback(async (request: CreateTemplateRequest) => {
    try {
      const response = await fetch('/api/export/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create template');
      }

      refresh();
      return data as TemplateResponse;
    } catch (err) {
      throw err;
    }
  }, [refresh]);

  const updateTemplate = useCallback(async (templateId: string, request: Partial<CreateTemplateRequest>) => {
    try {
      const response = await fetch(`/api/export/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update template');
      }

      refresh();
      return data as TemplateResponse;
    } catch (err) {
      throw err;
    }
  }, [refresh]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      const response = await fetch(`/api/export/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete template');
      }

      refresh();
      return true;
    } catch (err) {
      return false;
    }
  }, [refresh]);

  const duplicateTemplate = useCallback(async (template: TemplateResponse) => {
    const { id, createdAt, ...rest } = template;
    return createTemplate({
      ...rest,
      name: `${template.name} (Kopie)`,
    });
  }, [createTemplate]);

  return {
    templates: data?.templates || [],
    count: data?.count || 0,
    isLoading,
    error: error?.message || null,
    refresh,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  };
}

/**
 * Hook for managing scheduled exports (Enterprise only)
 *
 * @returns Scheduled export CRUD operations
 *
 * @example
 * ```tsx
 * const { scheduledExports, createScheduledExport, isLoading } = useScheduledExports();
 * ```
 */
export function useScheduledExports() {
  const { data, error, isLoading, mutate: refresh } = useSWR<{ scheduledExports: ScheduledExportResponse[] }>(
    '/api/export/scheduled',
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );

  const createScheduledExport = useCallback(async (request: CreateScheduledExportRequest) => {
    try {
      const response = await fetch('/api/export/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create scheduled export');
      }

      refresh();
      return data as ScheduledExportResponse;
    } catch (err) {
      throw err;
    }
  }, [refresh]);

  const updateScheduledExport = useCallback(async (id: string, request: Partial<CreateScheduledExportRequest>) => {
    try {
      const response = await fetch(`/api/export/scheduled/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update scheduled export');
      }

      refresh();
      return data as ScheduledExportResponse;
    } catch (err) {
      throw err;
    }
  }, [refresh]);

  const deleteScheduledExport = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/export/scheduled/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete scheduled export');
      }

      refresh();
      return true;
    } catch (err) {
      return false;
    }
  }, [refresh]);

  const toggleScheduledExport = useCallback(async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/export/scheduled/${id}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to toggle scheduled export');
      }

      refresh();
      return true;
    } catch (err) {
      return false;
    }
  }, [refresh]);

  return {
    scheduledExports: data?.scheduledExports || [],
    isLoading,
    error: error?.message || null,
    refresh,
    createScheduledExport,
    updateScheduledExport,
    deleteScheduledExport,
    toggleScheduledExport,
  };
}

/**
 * Hook for downloading an export file
 *
 * @returns Download function and state
 */
export function useExportDownload() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadExport = useCallback(async (exportId: string, fileName?: string) => {
    setIsDownloading(true);
    setError(null);

    try {
      // Get download URL
      const response = await fetch(`/api/export/download/${exportId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get download URL');
      }

      // Trigger download
      const link = document.createElement('a');
      link.href = data.downloadUrl;
      link.download = fileName || data.fileName || 'export';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
      return false;
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return {
    downloadExport,
    isDownloading,
    error,
  };
}

// Default export
export { useExport as default };
