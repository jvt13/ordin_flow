import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskCard } from '../components/TaskCard';
import { useTasks } from '../hooks/useTasks';
import { PRIORITY_LABELS, STATUS_LABELS } from '../constants';
import type { MainTabParamList, RootStackParamList } from '../navigation';

type TasksNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Tasks'>,
  NativeStackNavigationProp<RootStackParamList>
>;

import type { TaskPriority, TaskStatus } from '../types';

const STATUS_OPTIONS: (TaskStatus | undefined)[] = [undefined, 'PENDING', 'IN_PROGRESS', 'DONE', 'CANCELED'];
const PRIORITY_OPTIONS: (TaskPriority | undefined)[] = [undefined, 'URGENT', 'HIGH', 'MEDIUM', 'LOW'];

export function TasksScreen() {
  const navigation = useNavigation<TasksNav>();
  const [status, setStatus] = useState<TaskStatus | undefined>();
  const [priority, setPriority] = useState<TaskPriority | undefined>();
  const [search, setSearch] = useState('');

  const filters = useMemo(
    () => ({ status, priority, search: search || undefined, limit: 50 }),
    [status, priority, search],
  );

  const { data, isLoading, refetch, isRefetching } = useTasks(filters);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-5 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold mb-4">Tarefas</Text>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar..."
          placeholderTextColor="#64748B"
          className="bg-surface-card text-white rounded-xl px-4 py-3 mb-3 border border-surface-muted"
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_OPTIONS}
          keyExtractor={(item) => item ?? 'all-status'}
          className="mb-2"
          renderItem={({ item }) => (
            <FilterChip
              label={item ? STATUS_LABELS[item] : 'Todos'}
              active={status === item}
              onPress={() => setStatus(item)}
            />
          )}
        />

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={PRIORITY_OPTIONS}
          keyExtractor={(item) => item ?? 'all-priority'}
          renderItem={({ item }) => (
            <FilterChip
              label={item ? PRIORITY_LABELS[item] : 'Prioridade'}
              active={priority === item}
              onPress={() => setPriority(item)}
            />
          )}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={data?.tasks ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-8"
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <Text className="text-slate-500 text-center mt-12">Nenhuma tarefa encontrada</Text>
          }
          renderItem={({ item }) => (
            <TaskCard
              task={item}
              onPress={() => navigation.navigate('TaskDetail', { taskId: item.id })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`mr-2 px-4 py-2 rounded-full border ${
        active ? 'bg-primary border-primary' : 'bg-surface-card border-surface-muted'
      }`}
    >
      <Text className={`text-sm ${active ? 'text-white font-semibold' : 'text-slate-400'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
