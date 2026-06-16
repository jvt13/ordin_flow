import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as taskService from '../services/task.service';
import type { TaskFilters } from '../types';

export const taskKeys = {
  all: ['tasks'] as const,
  dashboard: ['tasks', 'dashboard'] as const,
  list: (filters: TaskFilters) => ['tasks', 'list', filters] as const,
  detail: (id: string) => ['tasks', 'detail', id] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: taskKeys.dashboard,
    queryFn: taskService.getDashboard,
    staleTime: 30_000,
  });
}

export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => taskService.getTasks(filters),
    staleTime: 15_000,
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: () => taskService.getTask(id),
    enabled: !!id,
  });
}

export function useCreateTextTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ text, location }: { text: string; location?: Parameters<typeof taskService.createTextTask>[1] }) =>
      taskService.createTextTask(text, location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useCreateVoiceTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uri, location }: { uri: string; location?: Parameters<typeof taskService.createVoiceTask>[1] }) =>
      taskService.createVoiceTask(uri, location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useCreateVoiceDraft() {
  return useMutation({
    mutationFn: ({ uri, location }: { uri: string; location?: Parameters<typeof taskService.createVoiceDraft>[1] }) =>
      taskService.createVoiceDraft(uri, location),
  });
}

export function useCreatePhotoTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      uri,
      text,
      location,
    }: {
      uri: string;
      text?: string;
      location?: Parameters<typeof taskService.createPhotoTask>[2];
    }) => taskService.createPhotoTask(uri, text, location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useConfirmDraftTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: taskService.confirmDraftTask,
    retry: false,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof taskService.updateTask>[1] }) =>
      taskService.updateTask(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(id) });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: taskService.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
