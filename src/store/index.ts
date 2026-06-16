import { create } from 'zustand';
import type { TaskDraft, User } from '../types';
import { clearAuthStorage, getRefreshToken, getStoredUser, saveTokens, saveUser } from '../utils/storage';
import * as authService from '../services/auth.service';
import { loadQueue, enqueue, dequeue, clearQueue, type OfflineTask } from '../features/offline/queue';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email, password) => {
    const result = await authService.login(email, password);
    await saveTokens(result.accessToken, result.refreshToken);
    await saveUser(result.user);
    set({ user: result.user, isAuthenticated: true });
  },

  register: async (name, email, password) => {
    const result = await authService.register(name, email, password);
    await saveTokens(result.accessToken, result.refreshToken);
    await saveUser(result.user);
    set({ user: result.user, isAuthenticated: true });
  },

  logout: async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch {
        // ignora erro de logout remoto
      }
    }
    await clearAuthStorage();
    set({ user: null, isAuthenticated: false });
  },

  hydrate: async () => {
    try {
      const storedUser = await getStoredUser<User>();
      if (storedUser) {
        set({ user: storedUser, isAuthenticated: true, isLoading: false });
        return;
      }
    } catch {
      await clearAuthStorage();
    }
    set({ isLoading: false });
  },
}));

export type VoiceProcessingStage =
  | 'idle'
  | 'uploading'
  | 'transcribing'
  | 'interpreting'
  | 'drafting'
  | 'saving';

interface CaptureState {
  isRecording: boolean;
  isProcessing: boolean;
  processingStage: VoiceProcessingStage;
  processingMessage: string;
  setRecording: (value: boolean) => void;
  setProcessing: (value: boolean, stage?: VoiceProcessingStage) => void;
  resetProcessing: () => void;
}

const STAGE_MESSAGES: Record<VoiceProcessingStage, string> = {
  idle: '',
  uploading: 'Enviando áudio...',
  transcribing: 'Transcrevendo localmente...',
  interpreting: 'Interpretando tarefa...',
  drafting: 'Preparando rascunho...',
  saving: 'Salvando tarefa...',
};

export const useCaptureStore = create<CaptureState>((set) => ({
  isRecording: false,
  isProcessing: false,
  processingStage: 'idle',
  processingMessage: '',

  setRecording: (isRecording) => set({ isRecording }),

  setProcessing: (isProcessing, stage = 'uploading') =>
    set({
      isProcessing,
      processingStage: isProcessing ? stage : 'idle',
      processingMessage: isProcessing ? STAGE_MESSAGES[stage] : '',
    }),

  resetProcessing: () =>
    set({
      isProcessing: false,
      processingStage: 'idle',
      processingMessage: '',
    }),
}));

// Fila offline persistida em AsyncStorage (ver features/offline/queue.ts)
type OfflineQueueState = {
  pendingItems: OfflineTask[];
  isLoaded: boolean;
  hydrate: () => Promise<void>;
  addPending: (draft: TaskDraft) => Promise<OfflineTask>;
  removePending: (id: string) => Promise<void>;
  clearPending: () => Promise<void>;
};

export const useOfflineQueueStore = create<OfflineQueueState>()((set) => ({
  pendingItems: [],
  isLoaded: false,

  hydrate: async () => {
    const items = await loadQueue();
    set({ pendingItems: items, isLoaded: true });
  },

  addPending: async (draft) => {
    const task = await enqueue(draft);
    set((s) => ({ pendingItems: [...s.pendingItems, task] }));
    return task;
  },

  removePending: async (id) => {
    await dequeue(id);
    set((s) => ({ pendingItems: s.pendingItems.filter((t) => t.id !== id) }));
  },

  clearPending: async () => {
    await clearQueue();
    set({ pendingItems: [] });
  },
}));
