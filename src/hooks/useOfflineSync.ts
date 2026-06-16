import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useOfflineQueueStore } from '../store';
import * as taskService from '../services/task.service';
import { taskKeys } from './useTasks';

export function useOfflineSync() {
  const pendingItems = useOfflineQueueStore((s) => s.pendingItems);
  const removePending = useOfflineQueueStore((s) => s.removePending);
  const hydrate = useOfflineQueueStore((s) => s.hydrate);
  const queryClient = useQueryClient();
  const isSyncing = useRef(false);

  const syncQueue = async () => {
    if (isSyncing.current || pendingItems.length === 0) return;
    isSyncing.current = true;
    for (const item of pendingItems) {
      try {
        await taskService.confirmDraftTask(item.draft);
        await removePending(item.id);
      } catch {
        break;
      }
    }
    isSyncing.current = false;
    queryClient.invalidateQueries({ queryKey: taskKeys.all });
  };

  useEffect(() => {
    const init = async () => {
      await hydrate();
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        await syncQueue();
      }
    };
    init();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (!state.isConnected) return;
      await syncQueue();
    });

    return () => unsubscribe();
  }, [pendingItems, removePending, queryClient]);
}
