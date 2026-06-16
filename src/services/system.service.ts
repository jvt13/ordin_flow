import { api } from './api';

export type SystemSettingGroup = 'gemini' | 'stt' | 'cloudinary';

export interface SystemSetting {
  key: string;
  label: string;
  description: string;
  group: SystemSettingGroup;
  isSecret: boolean;
  value: string;
  maskedValue: string;
  configured: boolean;
  source: 'database' | 'env' | 'default';
}

export interface SystemSettingAudit {
  id: string;
  settingKey: string;
  action: string;
  userId: string;
  userEmail: string | null;
  createdAt: string;
}

export type ServiceHealthStatus = 'ONLINE' | 'OFFLINE';

export interface ServiceHealthItem {
  name: string;
  status: ServiceHealthStatus;
  detail?: string;
}

export interface SystemHealthResponse {
  checkedAt: string;
  services: ServiceHealthItem[];
}

export async function getSystemSettings(): Promise<SystemSetting[]> {
  const { data } = await api.get<{ settings: SystemSetting[] }>('/system/settings');
  return data.settings;
}

export async function updateSystemSettings(
  settings: Array<{ key: string; value: string }>,
): Promise<SystemSetting[]> {
  const { data } = await api.put<{ settings: SystemSetting[] }>('/system/settings', { settings });
  return data.settings;
}

export async function getSystemSettingAudit(limit = 30): Promise<SystemSettingAudit[]> {
  const { data } = await api.get<{ audit: SystemSettingAudit[] }>('/system/settings/audit', {
    params: { limit },
  });
  return data.audit;
}

export async function getSystemHealth(): Promise<SystemHealthResponse> {
  const { data } = await api.get<SystemHealthResponse>('/system/health');
  return data;
}
