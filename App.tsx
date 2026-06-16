import './global.css';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { RootNavigator } from './src/navigation';
import { useAuthStore } from './src/store';
import { useOfflineSync } from './src/hooks/useOfflineSync';
import { requestNotificationPermission } from './src/utils/notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Monitora a conexão e sincroniza a fila offline.
// Precisa ficar dentro do QueryClientProvider (usa useQueryClient).
function OfflineSync() {
  useOfflineSync();
  return null;
}

export default function App() {
  const { isAuthenticated, isLoading, hydrate, user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    hydrate();
    requestNotificationPermission();
  }, [hydrate]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <OfflineSync />
          <NavigationContainer>
            <StatusBar style="light" />
            <RootNavigator isAuthenticated={isAuthenticated} isAdmin={isAdmin} />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
