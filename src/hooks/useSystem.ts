import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as systemService from '../services/system.service';

export const systemKeys = {
  settings: ['system', 'settings'] as const,
  audit: ['system', 'audit'] as const,
  health: ['system', 'health'] as const,
};

export function useSystemSettings() {
  return useQuery({
    queryKey: systemKeys.settings,
    queryFn: systemService.getSystemSettings,
  });
}

export function useSystemSettingAudit() {
  return useQuery({
    queryKey: systemKeys.audit,
    queryFn: () => systemService.getSystemSettingAudit(),
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: systemKeys.health,
    queryFn: systemService.getSystemHealth,
    refetchInterval: 30_000,
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Array<{ key: string; value: string }>) =>
      systemService.updateSystemSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemKeys.settings });
      queryClient.invalidateQueries({ queryKey: systemKeys.audit });
      queryClient.invalidateQueries({ queryKey: systemKeys.health });
    },
  });
}
