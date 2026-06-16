import { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Task } from '../types';
import { CATEGORY_LABELS, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS } from '../constants';
import { formatDate, formatRelativeDate, isOverdue } from '../utils/format';
import { Badge } from './ui';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
}

export const TaskCard = memo(function TaskCard({ task, onPress }: TaskCardProps) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'DONE';

  return (
    <Pressable
      onPress={onPress}
      className="bg-surface-card rounded-2xl p-4 mb-3 border border-surface-muted/50 active:opacity-80"
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-white font-semibold text-base flex-1 mr-2" numberOfLines={2}>
          {task.title}
        </Text>
        <Badge label={PRIORITY_LABELS[task.priority]} color={PRIORITY_COLORS[task.priority]} />
      </View>

      {task.description && (
        <Text className="text-slate-400 text-sm mb-3" numberOfLines={2}>
          {task.description}
        </Text>
      )}

      <View className="flex-row flex-wrap gap-2 items-center">
        <Badge label={STATUS_LABELS[task.status]} color="#94A3B8" />
        <Badge label={CATEGORY_LABELS[task.category]} color="#6366F1" />
        {task.dueDate && (
          <Text className={`text-xs ${overdue ? 'text-danger' : 'text-slate-500'}`}>
            {formatRelativeDate(task.dueDate)} · {formatDate(task.dueDate)}
          </Text>
        )}
      </View>
    </Pressable>
  );
});
