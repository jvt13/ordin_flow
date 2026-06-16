import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Badge, Button, Card } from '../components/ui';
import { useDeleteTask, useTask, useUpdateTask } from '../hooks/useTasks';
import { CATEGORY_LABELS, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS } from '../constants';
import { formatDate } from '../utils/format';
import { getErrorMessage } from '../services/api';
import { uploadImageAttachment } from '../services/task.service';
import {
  combineDateAndOptionalTime,
  formatDueDateDisplay,
  formatTimeDisplay,
  getDueDatePickerValue,
  parseDueDateInput,
} from '../utils/dueDate';
import { resolveMediaUrl } from '../utils/media';
import type { RootStackParamList } from '../navigation';
import type { TaskAttachment, TaskStatus } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'TaskDetail'>;

const STATUS_FLOW: TaskStatus[] = ['PENDING', 'IN_PROGRESS', 'DONE', 'CANCELED'];
type EditAttachment = {
  id: string;
  url?: string;
  localUri?: string;
  note?: string | null;
  createdAt?: string;
};

export function TaskDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { taskId } = route.params;
  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask();
  const retryMutation = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [updating, setUpdating] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState<Date | null>(null);
  const [editTime, setEditTime] = useState<Date | null>(null);
  const [editAttachments, setEditAttachments] = useState<EditAttachment[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleStatusChange = async (status: TaskStatus) => {
    try {
      setUpdating(true);
      await updateTask.mutateAsync({ id: taskId, payload: { status } });
    } catch (error) {
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Excluir tarefa', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask.mutateAsync(taskId);
            navigation.goBack();
          } catch (error) {
            Alert.alert('Erro', getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const openMaps = () => {
    if (!task?.latitude || !task?.longitude) return;
    Linking.openURL(`https://maps.google.com/?q=${task.latitude},${task.longitude}`);
  };

  const openEdit = () => {
    if (!task) return;
    setEditText(task.transcription ?? task.description ?? task.title);
    const parsed = parseDueDateInput(task.dueDate);
    setEditDate(parsed ?? null);
    setEditTime(parsed ?? null);
    setEditAttachments(
      task.attachments?.length
        ? task.attachments
        : (task.imageUrls?.length ? task.imageUrls : task.imageUrl ? [task.imageUrl] : []).map((url, index) => ({
            id: `legacy_${index}`,
            url,
            note: '',
            createdAt: undefined,
          })),
    );
    setEditVisible(true);
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (event.type !== 'set' || !date) return;
    const base = new Date(date);
    base.setHours(12, 0, 0, 0);
    setEditDate(base);
    setShowDatePicker(false);
  };

  const handleTimeChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    if (event.type !== 'set' || !date) return;
    setEditTime(date);
    setShowTimePicker(false);
  };

  const handleAddPhotoFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: false });
    if (result.canceled || !result.assets[0]) return;
    setEditAttachments((prev) => [
      ...prev,
      {
        id: `new_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        localUri: result.assets[0].uri,
        note: '',
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleAddPhotoFromCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão', 'Câmera necessária para capturar fotos');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false });
    if (result.canceled || !result.assets[0]) return;
    setEditAttachments((prev) => [
      ...prev,
      {
        id: `new_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        localUri: result.assets[0].uri,
        note: '',
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const handleRemoveAttachment = (id: string) => {
    setEditAttachments((prev) => prev.filter((att) => att.id !== id));
  };

  const handleAttachmentNoteChange = (id: string, note: string) => {
    setEditAttachments((prev) =>
      prev.map((att) => (att.id === id ? { ...att, note } : att)),
    );
  };

  const handleRetry = async () => {
    if (!task?.transcription) return;
    try {
      await retryMutation.mutateAsync({
        id: task.id,
        payload: {
          transcription: task.transcription,
          description: task.description ?? '',
        },
      });
    } catch {
      // erro já tratado pelo useUpdateTask
    }
  };

  const handleSaveEdit = async () => {
    if (!task) return;
    try {
      setUpdating(true);
      const dueDate = editDate ? combineDateAndOptionalTime(editDate, editTime) : null;
      const finalized: TaskAttachment[] = [];

      for (const att of editAttachments) {
        let url = att.url;
        if (!url && att.localUri) {
          url = await uploadImageAttachment(att.localUri);
        }
        if (!url) continue;
        finalized.push({
          id: att.id,
          url,
          note: att.note ?? '',
          createdAt: att.createdAt ?? new Date().toISOString(),
        });
      }

      const textTrimmed = editText.trim();
      const currentText = (task.transcription ?? task.description ?? task.title).trim();
      const textChanged = textTrimmed !== currentText;

      await updateTask.mutateAsync({
        id: taskId,
        payload: {
          ...(textChanged
            ? {
                transcription: textTrimmed,
                description: textTrimmed,
              }
            : {}),
          dueDate,
          aiRawResponse: {
            ...(task as unknown as { aiRawResponse?: object }).aiRawResponse,
            attachedPhotos: finalized.map((a) => a.url),
            attachments: finalized,
          },
        },
      });
      setEditVisible(false);
    } catch (error) {
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setUpdating(false);
    }
  };

  if (isLoading || !task) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['bottom']}>
      <ScrollView className="flex-1 px-5 py-4">
        <Text className="text-white text-2xl font-bold mb-3">{task.title}</Text>

        <View className="flex-row flex-wrap gap-2 mb-4">
          <Badge label={PRIORITY_LABELS[task.priority]} color={PRIORITY_COLORS[task.priority]} />
          <Badge label={STATUS_LABELS[task.status]} color="#94A3B8" />
          <Badge label={CATEGORY_LABELS[task.category]} color="#6366F1" />
        </View>

        {task.description && (
          <Card className="mb-4">
            <Text className="text-slate-400 text-sm mb-1">Descrição</Text>
            <Text className="text-white">{task.description}</Text>
          </Card>
        )}

        {task.transcription && (
          <Card className="mb-4">
            <Text className="text-slate-400 text-sm mb-1">Transcrição original</Text>
            <Text className="text-white italic">{task.transcription}</Text>
          </Card>
        )}

        {(task as unknown as { aiRawResponse?: { retryable?: boolean } }).aiRawResponse?.retryable === true && (
          <TouchableOpacity
            onPress={handleRetry}
            disabled={retryMutation.isPending}
            style={{
              marginTop: 12,
              marginHorizontal: 16,
              backgroundColor: '#F59E0B',
              borderRadius: 8,
              padding: 12,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
              {retryMutation.isPending ? 'Reprocessando...' : '⚡ Reprocessar com IA'}
            </Text>
          </TouchableOpacity>
        )}

        <Card className="mb-4">
          <Text className="text-slate-400 text-sm mb-2">Datas</Text>
          <Text className="text-white">Criada: {formatDate(task.createdAt)}</Text>
          <Text className="text-white mt-1">Atualizada: {formatDate(task.updatedAt)}</Text>
          <Text className="text-white mt-1">Prazo: {formatDate(task.dueDate)}</Text>
        </Card>

        {task.address && (
          <Card className="mb-4">
            <Text className="text-slate-400 text-sm mb-1">Localização</Text>
            <Text className="text-white">{task.address}</Text>
            {task.latitude && task.longitude && (
              <Button title="Abrir no mapa" variant="ghost" size="sm" className="mt-3" onPress={openMaps} />
            )}
          </Card>
        )}

        {(task.attachments?.length
          ? task.attachments
          : (task.imageUrls?.length ? task.imageUrls : task.imageUrl ? [task.imageUrl] : []).map((url, index) => ({
              id: `legacy_${index}`,
              url,
              note: null,
              createdAt: undefined,
            }))).map((item, index) => (
            <Card key={`${item.id}-${index}`} className="mb-4">
              <Text className="text-slate-400 text-sm mb-2">
                {index === 0 ? 'Anexo' : `Anexo ${index + 1}`}
              </Text>
              <Pressable onPress={() => setSelectedImage(resolveMediaUrl(item.url))}>
                <Image source={{ uri: resolveMediaUrl(item.url) }} className="w-full h-32 rounded-xl" resizeMode="cover" />
              </Pressable>
              {!!item.note && <Text className="text-slate-300 text-sm mt-2">{item.note}</Text>}
              {item.createdAt && <Text className="text-slate-500 text-xs mt-1">{formatDate(item.createdAt)}</Text>}
            </Card>
          ))}

        {task.audioUrl && (
          <Card className="mb-4">
            <Text className="text-slate-400 text-sm mb-1">Áudio original</Text>
            <Text className="text-primary-light text-sm">{task.audioUrl}</Text>
          </Card>
        )}

        <Text className="text-white font-semibold mb-3">Alterar status</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {STATUS_FLOW.map((s) => (
            <Button
              key={s}
              title={STATUS_LABELS[s]}
              size="sm"
              variant={task.status === s ? 'primary' : 'secondary'}
              onPress={() => handleStatusChange(s)}
              loading={updating}
              disabled={task.status === s}
            />
          ))}
        </View>

        {task.activities.length > 0 && (
          <>
            <Text className="text-white font-semibold mb-3">Histórico</Text>
            {task.activities.map((activity) => (
              <View key={activity.id} className="border-l-2 border-primary pl-3 mb-3">
                <Text className="text-white text-sm">{activity.message}</Text>
                <Text className="text-slate-500 text-xs mt-1">{formatDate(activity.createdAt)}</Text>
              </View>
            ))}
          </>
        )}

        <View className="flex-row gap-3 mt-4 mb-8">
          <Button title="Editar tarefa" variant="secondary" className="flex-1" onPress={openEdit} />
          <Button title="Excluir tarefa" variant="danger" className="flex-1" onPress={handleDelete} />
        </View>
      </ScrollView>

      <Modal visible={editVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <View className="flex-1 bg-black/80 pt-16 px-4 pb-2">
            <View className="bg-surface-card border border-surface-muted rounded-2xl flex-1 max-h-[92%] p-4">
              <Text className="text-white text-lg font-bold mb-2">Editar tarefa</Text>

              <ScrollView
                className="flex-1"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                <Text className="text-slate-300 text-xs mb-1">Texto principal</Text>
                <TextInput
                  value={editText}
                  onChangeText={setEditText}
                  multiline
                  placeholder="Texto da tarefa"
                  placeholderTextColor="#64748B"
                  className="text-white border border-surface-muted rounded-xl px-3 py-2 mb-3 min-h-[100px]"
                  style={{ textAlignVertical: 'top' }}
                />

                <Text className="text-slate-300 text-xs mb-1">Data limite</Text>
                <Pressable
                  className="border border-surface-muted rounded-xl px-3 py-3 mb-2"
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text className={editDate ? 'text-white' : 'text-slate-400'}>
                    {formatDueDateDisplay(editDate?.toISOString())}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={editDate ?? getDueDatePickerValue(task.dueDate)}
                    mode="date"
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                  />
                )}

                <Text className="text-slate-300 text-xs mb-1">Hora (opcional)</Text>
                <Pressable
                  className="border border-surface-muted rounded-xl px-3 py-3 mb-2"
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text className={editTime ? 'text-white' : 'text-slate-400'}>
                    {formatTimeDisplay(editTime?.toISOString())}
                  </Text>
                </Pressable>
                {showTimePicker && (
                  <DateTimePicker
                    value={editTime ?? getDueDatePickerValue(task.dueDate)}
                    mode="time"
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleTimeChange}
                  />
                )}

                {editAttachments.length > 0 && (
                  <View className="mb-3">
                    <Text className="text-slate-300 text-xs mb-2">
                      Imagens anexadas ({editAttachments.length})
                    </Text>
                    {editAttachments.map((att) => {
                      const preview = att.localUri ?? att.url;
                      if (!preview) return null;
                      return (
                        <View key={att.id} className="mb-2 border border-surface-muted/40 rounded-xl p-2">
                          <Image
                            source={{ uri: resolveMediaUrl(preview) }}
                            className="w-full h-28 rounded-lg mb-2 bg-surface-muted"
                            resizeMode="cover"
                          />
                          <TextInput
                            value={att.note ?? ''}
                            onChangeText={(value) => handleAttachmentNoteChange(att.id, value)}
                            placeholder="Observação da imagem (opcional)"
                            placeholderTextColor="#64748B"
                            className="text-white border border-surface-muted rounded-lg px-3 py-2 text-sm"
                          />
                          <Button
                            title="Excluir imagem"
                            variant="ghost"
                            size="sm"
                            className="mt-1"
                            onPress={() => handleRemoveAttachment(att.id)}
                          />
                        </View>
                      );
                    })}
                  </View>
                )}

                <View className="flex-row gap-2 mb-2">
                  <Button title="📷 Câmera" variant="secondary" className="flex-1" onPress={handleAddPhotoFromCamera} />
                  <Button title="🖼️ Galeria" variant="secondary" className="flex-1" onPress={handleAddPhotoFromGallery} />
                </View>
              </ScrollView>

              <View
                className="flex-row gap-3 pt-3 border-t border-surface-muted"
                style={{ paddingBottom: insets.bottom + 4 }}
              >
                <Button title="Cancelar" variant="ghost" className="flex-1" onPress={() => setEditVisible(false)} />
                <Button title="Salvar alterações" className="flex-1" onPress={handleSaveEdit} loading={updating} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={!!selectedImage} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/90 items-center justify-center px-4" onPress={() => setSelectedImage(null)}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} className="w-full h-[70%] rounded-xl" resizeMode="contain" />
          )}
          <Text className="text-slate-300 mt-4">Toque para fechar</Text>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
