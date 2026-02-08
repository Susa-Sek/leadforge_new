// Export Storage Utilities
// src/lib/export/storage.ts
// Supabase Storage integration for export files

import { createClient as createServerClient } from '@/lib/supabase/server';

// ============================================
// STORAGE CONFIGURATION
// ============================================

const EXPORTS_BUCKET = 'exports';
const DEFAULT_EXPIRY_SECONDS = 3600; // 1 hour

// ============================================
// FILE PATH GENERATION
// ============================================

/**
 * Generate storage path for export file
 * Format: exports/{user_id}/{export_id}.{ext}
 */
export function generateFilePath(
  userId: string,
  exportId: string,
  format: 'csv' | 'excel'
): string {
  const ext = format === 'csv' ? 'csv' : 'xlsx';
  return `${userId}/${exportId}.${ext}`;
}

/**
 * Generate display filename for user download
 * Format: manyleads_{type}_{YYYY-MM-DD}_{HH-mm}.{ext}
 */
export function generateDisplayFilename(
  exportType: 'contacts' | 'deals' | 'leads',
  format: 'csv' | 'excel'
): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-mm-ss

  const typeMap: Record<string, string> = {
    contacts: 'kontakte',
    deals: 'deals',
    leads: 'leads',
  };

  const ext = format === 'csv' ? 'csv' : 'xlsx';

  return `manyleads_${typeMap[exportType]}_${dateStr}_${timeStr}.${ext}`;
}

// ============================================
// FILE UPLOAD
// ============================================

/**
 * Upload export file to Supabase Storage
 */
export async function uploadExportFile(
  userId: string,
  exportId: string,
  format: 'csv' | 'excel',
  fileBuffer: Buffer
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const supabase = await createServerClient();
    const filePath = generateFilePath(userId, exportId, format);
    const contentType = format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    const { error } = await supabase.storage
      .from(EXPORTS_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Error uploading export file:', error);
      return {
        success: false,
        error: `Speicherfehler: ${error.message}`,
      };
    }

    return {
      success: true,
      filePath,
    };
  } catch (error) {
    console.error('Exception uploading export file:', error);
    return {
      success: false,
      error: 'Unerwarteter Fehler beim Upload der Datei.',
    };
  }
}

// ============================================
// SIGNED URL GENERATION
// ============================================

/**
 * Generate signed download URL for export file
 */
export async function generateDownloadUrl(
  filePath: string,
  expiresInSeconds: number = DEFAULT_EXPIRY_SECONDS
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase.storage
      .from(EXPORTS_BUCKET)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error) {
      console.error('Error creating signed URL:', error);
      return {
        success: false,
        error: `Fehler beim Erstellen der Download-URL: ${error.message}`,
      };
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
    };
  } catch (error) {
    console.error('Exception creating signed URL:', error);
    return {
      success: false,
      error: 'Unerwarteter Fehler beim Erstellen der Download-URL.',
    };
  }
}

/**
 * Get public URL for export file (if bucket is public)
 * Note: Export bucket should be private with RLS
 */
export async function getPublicUrl(
  filePath: string
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { data } = supabase.storage
      .from(EXPORTS_BUCKET)
      .getPublicUrl(filePath);

    return {
      success: true,
      publicUrl: data.publicUrl,
    };
  } catch (error) {
    console.error('Exception getting public URL:', error);
    return {
      success: false,
      error: 'Fehler beim Abrufen der URL.',
    };
  }
}

// ============================================
// FILE MANAGEMENT
// ============================================

/**
 * Delete export file from storage
 */
export async function deleteExportFile(
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase.storage
      .from(EXPORTS_BUCKET)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting export file:', error);
      return {
        success: false,
        error: `Fehler beim Loeschen der Datei: ${error.message}`,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception deleting export file:', error);
    return {
      success: false,
      error: 'Unerwarteter Fehler beim Loeschen der Datei.',
    };
  }
}

/**
 * Check if export file exists
 */
export async function fileExists(
  filePath: string
): Promise<{ success: boolean; exists: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    // Try to get metadata
    const { data, error } = await supabase.storage
      .from(EXPORTS_BUCKET)
      .list(filePath.split('/')[0], {
        search: filePath.split('/').pop(),
      });

    if (error) {
      return {
        success: false,
        exists: false,
        error: error.message,
      };
    }

    const exists = data && data.some(item => item.name === filePath.split('/').pop());

    return {
      success: true,
      exists: exists || false,
    };
  } catch (error) {
    console.error('Exception checking file existence:', error);
    return {
      success: false,
      exists: false,
      error: 'Fehler beim Pruefen der Datei.',
    };
  }
}

// ============================================
// BUCKET MANAGEMENT
// ============================================

/**
 * Create exports bucket (to be called once during setup)
 * Note: This requires admin/service role permissions
 */
export async function createExportsBucket(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { error } = await supabase.storage.createBucket(EXPORTS_BUCKET, {
      public: false,
      fileSizeLimit: 100 * 1024 * 1024, // 100 MB limit
      allowedMimeTypes: [
        'text/csv',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
      ],
    });

    if (error) {
      // Bucket might already exist
      if (error.message.includes('already exists')) {
        return { success: true };
      }

      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception creating bucket:', error);
    return {
      success: false,
      error: 'Fehler beim Erstellen des Storage-Buckets.',
    };
  }
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate that user owns the export file (for RLS)
 */
export function validateFileOwnership(
  filePath: string,
  userId: string
): boolean {
  // File path format: {user_id}/{export_id}.{ext}
  const pathUserId = filePath.split('/')[0];
  return pathUserId === userId;
}

/**
 * Get file size from metadata
 */
export async function getFileSize(
  filePath: string
): Promise<{ success: boolean; size?: number; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase.storage
      .from(EXPORTS_BUCKET)
      .list(filePath.split('/')[0], {
        search: filePath.split('/').pop(),
      });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const file = data?.find(item => item.name === filePath.split('/').pop());

    if (!file) {
      return {
        success: false,
        error: 'Datei nicht gefunden.',
      };
    }

    return {
      success: true,
      size: file.metadata?.size || 0,
    };
  } catch (error) {
    console.error('Exception getting file size:', error);
    return {
      success: false,
      error: 'Fehler beim Abrufen der Dateigroesse.',
    };
  }
}

// ============================================
// CLEANUP
// ============================================

/**
 * List all export files for a user
 */
export async function listUserExportFiles(
  userId: string
): Promise<{ success: boolean; files?: string[]; error?: string }> {
  try {
    const supabase = await createServerClient();

    const { data, error } = await supabase.storage
      .from(EXPORTS_BUCKET)
      .list(userId);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    const files = data?.map(item => `${userId}/${item.name}`) || [];

    return {
      success: true,
      files,
    };
  } catch (error) {
    console.error('Exception listing files:', error);
    return {
      success: false,
      error: 'Fehler beim Auflisten der Dateien.',
    };
  }
}

/**
 * Delete all export files for a user (cleanup)
 */
export async function deleteUserExportFiles(
  userId: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
  try {
    const { success, files, error: listError } = await listUserExportFiles(userId);

    if (!success || !files) {
      return {
        success: false,
        deletedCount: 0,
        error: listError || 'Fehler beim Auflisten der Dateien.',
      };
    }

    if (files.length === 0) {
      return { success: true, deletedCount: 0 };
    }

    const supabase = await createServerClient();

    const { error } = await supabase.storage
      .from(EXPORTS_BUCKET)
      .remove(files);

    if (error) {
      return {
        success: false,
        deletedCount: 0,
        error: error.message,
      };
    }

    return {
      success: true,
      deletedCount: files.length,
    };
  } catch (error) {
    console.error('Exception deleting user files:', error);
    return {
      success: false,
      deletedCount: 0,
      error: 'Fehler beim Loeschen der Dateien.',
    };
  }
}
