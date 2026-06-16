import { api } from './api';
import type {
  DashboardStats,
  LocationData,
  Task,
  TaskDraft,
  TaskDetail,
  TaskFilters,
  TaskListResponse,
} from '../types';

export async function getDashboard(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/tasks/dashboard');
  return data;
}

export async function getTasks(filters: TaskFilters = {}): Promise<TaskListResponse> {
  const { data } = await api.get<TaskListResponse>('/tasks', { params: filters });
  return data;
}

export async function getTask(id: string): Promise<TaskDetail> {
  const { data } = await api.get<TaskDetail>(`/tasks/${id}`);
  return data;
}

export async function createTextTask(
  text: string,
  location?: LocationData | null,
): Promise<Task> {
  const { data } = await api.post<Task>('/tasks/text', {
    text,
    latitude: location?.latitude,
    longitude: location?.longitude,
    address: location?.address,
  });
  return data;
}

export async function createTextDraft(
  text: string,
  location?: LocationData | null,
): Promise<TaskDraft> {
  const { data } = await api.post<TaskDraft>('/tasks/text/draft', {
    text,
    latitude: location?.latitude,
    longitude: location?.longitude,
    address: location?.address,
  });
  return data;
}

export async function createVoiceTask(
  uri: string,
  location?: LocationData | null,
): Promise<Task> {
  const formData = new FormData();
  formData.append('audio', {
    uri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  if (location) {
    formData.append('latitude', String(location.latitude));
    formData.append('longitude', String(location.longitude));
    if (location.address) formData.append('address', location.address);
  }

  const { data } = await api.post<Task>('/tasks/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return data;
}

export async function createVoiceDraft(
  uri: string,
  location?: LocationData | null,
): Promise<TaskDraft> {
  const formData = new FormData();
  formData.append('audio', {
    uri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  if (location) {
    formData.append('latitude', String(location.latitude));
    formData.append('longitude', String(location.longitude));
    if (location.address) formData.append('address', location.address);
  }

  const { data } = await api.post<TaskDraft>('/tasks/voice/draft', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return data;
}

export async function createPhotoTask(
  uri: string,
  text?: string,
  location?: LocationData | null,
): Promise<Task> {
  const formData = new FormData();
  formData.append('image', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  if (text) formData.append('text', text);
  if (location) {
    formData.append('latitude', String(location.latitude));
    formData.append('longitude', String(location.longitude));
    if (location.address) formData.append('address', location.address);
  }

  const { data } = await api.post<Task>('/tasks/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return data;
}

/** Upload de imagem — apenas anexo, sem IA */
export async function uploadImageAttachment(uri: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob);

  const { data } = await api.post<{ url: string }>('/tasks/attachments/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  });
  return data.url;
}

export async function confirmDraftTask(draft: TaskDraft): Promise<Task> {
  const finalText = draft.transcription?.trim() ?? '';
  const attachments: Array<{ id: string; url: string; note?: string | null; createdAt: string }> = [];

  for (const item of draft.attachments) {
    let url = item.url;
    if (!url && item.localUri) {
      url = await uploadImageAttachment(item.localUri);
    }
    if (!url) continue;
    attachments.push({
      id: item.id,
      url,
      note: item.note ?? null,
      createdAt: item.createdAt,
    });
  }

  const payload = {
    finalText,
    transcription: finalText,
    dueDate: draft.dueDate ?? null,
    attachedPhotos: attachments.map((a) => a.url),
    attachments,
    audioReference: draft.audioReference,
    aiRawResponse: draft.aiRawResponse,
    latitude: draft.latitude,
    longitude: draft.longitude,
    address: draft.address,
  };

  const { data } = await api.post<Task>('/tasks/confirm', payload);
  return data;
}

export async function updateTask(
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    transcription: string;
    priority: string;
    category: string;
    status: string;
    dueDate: string | null;
    aiRawResponse: unknown;
    latitude: number | null;
    longitude: number | null;
    address: string | null;
  }>,
): Promise<Task> {
  const { data } = await api.patch<Task>(`/tasks/${id}`, payload);
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  await api.delete(`/tasks/${id}`);
}
