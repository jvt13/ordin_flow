import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TaskDraft } from '../../types';

const QUEUE_KEY = 'ordin:offline_queue';

export type OfflineTask = {
  id: string;
  draft: TaskDraft;
  createdAt: string;
};

export async function loadQueue(): Promise<OfflineTask[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as OfflineTask[]) : [];
  } catch {
    return [];
  }
}

export async function enqueue(draft: TaskDraft): Promise<OfflineTask> {
  const task: OfflineTask = {
    id: `offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    draft,
    createdAt: new Date().toISOString(),
  };
  const current = await loadQueue();
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...current, task]));
  return task;
}

export async function dequeue(id: string): Promise<void> {
  const current = await loadQueue();
  const updated = current.filter((t) => t.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(updated));
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
