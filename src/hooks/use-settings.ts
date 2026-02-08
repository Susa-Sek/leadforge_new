// Settings Hooks - Epic E13
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';

// ==================== TYPES ====================

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  job_title: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  company_name?: string | null;
  job_title?: string | null;
}

export interface AccountSettings {
  language: string;
  timezone: string;
  date_format: string;
  currency: string;
}

export interface SecuritySettings {
  has_password: boolean;
  two_factor_enabled: boolean;
  sessions: SessionInfo[];
}

export interface SessionInfo {
  id: string;
  device: string;
  location: string;
  last_active: string;
  is_current: boolean;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
}

// ==================== PROFILE ====================

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR(
    'profile',
    async () => {
      const res = await fetch('/api/settings/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      const json = await res.json();
      return json.profile as Profile;
    },
    {
      revalidateOnFocus: false,
    }
  );

  return {
    profile: data,
    isLoading,
    error,
    mutate,
  };
}

export function useUpdateProfile() {
  return useSWRMutation(
    'profile',
    async (_, { arg }: { arg: ProfileUpdateData }) => {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      return res.json();
    }
  );
}

export function useUploadAvatar() {
  return useSWRMutation(
    'profile',
    async (_, { arg }: { arg: File }) => {
      const formData = new FormData();
      formData.append('avatar', arg);

      const res = await fetch('/api/settings/avatar', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to upload avatar');
      }
      return res.json();
    }
  );
}

// ==================== ACCOUNT SETTINGS ====================

export function useAccountSettings() {
  const { data, error, isLoading, mutate } = useSWR(
    'account-settings',
    async () => {
      const res = await fetch('/api/settings/account');
      if (!res.ok) throw new Error('Failed to fetch account settings');
      const json = await res.json();
      return {
        email: json.email as string,
        created_at: json.created_at as string,
        plan_tier: json.plan_tier as string,
        settings: json.settings as AccountSettings,
      };
    },
    {
      revalidateOnFocus: false,
    }
  );

  return {
    account: data,
    isLoading,
    error,
    mutate,
  };
}

export function useUpdateAccountSettings() {
  return useSWRMutation(
    'account-settings',
    async (_, { arg }: { arg: Partial<AccountSettings> }) => {
      const res = await fetch('/api/settings/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update settings');
      }
      return res.json();
    }
  );
}

// ==================== SECURITY ====================

export function useSecuritySettings() {
  const { data, error, isLoading, mutate } = useSWR(
    'security-settings',
    async () => {
      const res = await fetch('/api/settings/security');
      if (!res.ok) throw new Error('Failed to fetch security settings');
      const json = await res.json();
      return {
        has_password: json.has_password as boolean,
        two_factor_enabled: json.two_factor_enabled as boolean,
        sessions: (json.sessions || []) as SessionInfo[],
      };
    },
    {
      revalidateOnFocus: false,
    }
  );

  return {
    security: data,
    isLoading,
    error,
    mutate,
  };
}

export function useChangePassword() {
  return useSWRMutation(
    'security-settings',
    async (_, { arg }: { arg: PasswordChangeData }) => {
      const res = await fetch('/api/settings/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to change password');
      }
      return res.json();
    }
  );
}
