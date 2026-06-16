import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecordButton } from '../components/RecordingPulse';
import { Button, LoadingOverlay, StatCard } from '../components/ui';
import {
  attachLocalPhotoToDraft,
  countDraftPhotos,
  createEmptyDraft,
  mergeVoiceIntoDraft,
} from '../features/tasks/draft/utils';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { useConfirmDraftTask, useCreateVoiceDraft, useDashboard } from '../hooks/useTasks';
import { getErrorMessage, isSttError } from '../services/api';
import { useVoiceStageProgress } from '../hooks/useVoiceStageProgress';
import { useAuthStore, useCaptureStore } from '../store';
import {
  combineDateAndOptionalTime,
  formatDueDateDisplay,
  formatTimeDisplay,
  getDueDatePickerValue,
  logDueDate,
  parseDueDateInput,
  toIsoDueDate,
} from '../utils/dueDate';
import { compressImage } from '../utils/image';
import { getCurrentLocation } from '../utils/location';
import type { MainTabParamList } from '../navigation';
import type { TaskDraft } from '../types';

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { isRecording, startRecording, stopRecording } = useVoiceRecorder();
  const { isProcessing, processingMessage, setProcessing, resetProcessing } = useCaptureStore();
  const voiceStages = useVoiceStageProgress();
  const { data: stats } = useDashboard();
  const createVoiceDraft = useCreateVoiceDraft();
  const confirmDraft = useConfirmDraftTask();

  const confirmingRef = useRef(false);

  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [reviewVisible, setReviewVisible] = useState(false);
  const [draft, setDraft] = useState<TaskDraft | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [draftDateOnly, setDraftDateOnly] = useState<Date | null>(null);
  const [draftTimeOnly, setDraftTimeOnly] = useState<Date | null>(null);

  const processingBusy = isProcessing || confirmDraft.isPending;

  const openDraft = useCallback((nextDraft: TaskDraft) => {
    const parsed = parseDueDateInput(nextDraft.dueDate);
    setDraft({
      ...nextDraft,
      attachments: nextDraft.attachments ?? [],
    });
    setDraftDateOnly(parsed ?? null);
    setDraftTimeOnly(parsed ?? null);
    setReviewVisible(true);
  }, []);

  const attachPhotoLocally = useCallback(async (uri: string) => {
    const compressed = await compressImage(uri);
    setDraft((prev) => attachLocalPhotoToDraft(prev, compressed));
    setReviewVisible(true);
  }, []);

  const handleVoiceComplete = useCallback(async () => {
    try {
      const uri = await stopRecording();
      if (!uri) return;

      voiceStages.start();
      const location = await getCurrentLocation();
      const voiceDraft = await createVoiceDraft.mutateAsync({ uri, location });
      setDraft((prev) => {
        const merged = prev ? mergeVoiceIntoDraft(prev, voiceDraft) : voiceDraft;
        return {
          ...merged,
          attachments: prev?.attachments ?? merged.attachments ?? [],
        };
      });
      setReviewVisible(true);
    } catch (error) {
      const message = getErrorMessage(error);
      const sttFailed = isSttError(error);
      Alert.alert(
        sttFailed ? 'Transcrição indisponível' : 'Erro ao processar áudio',
        sttFailed ? `${message}\n\nTente gravar novamente.` : message,
      );
    } finally {
      voiceStages.clear();
      resetProcessing();
    }
  }, [stopRecording, createVoiceDraft, voiceStages, resetProcessing]);

  const handleStartRecord = async () => {
    try {
      await startRecording();
    } catch (error) {
      Alert.alert('Erro', getErrorMessage(error));
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    const location = await getCurrentLocation();
    const text = textInput.trim();
    setDraft((prev) => {
      const base = prev ?? createEmptyDraft(location);
      return {
        ...base,
        transcription: `${base.transcription ?? ''}\n\n${text}`.trim(),
      };
    });
    setTextInput('');
    setShowTextInput(false);
    setReviewVisible(true);
  };

  const handleCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão', 'Câmera necessária para capturar fotos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: false });
    if (result.canceled || !result.assets[0]) return;

    try {
      await attachPhotoLocally(result.assets[0].uri);
    } catch (error) {
      Alert.alert('Erro', getErrorMessage(error));
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: false });
    if (result.canceled || !result.assets[0]) return;

    try {
      await attachPhotoLocally(result.assets[0].uri);
    } catch (error) {
      Alert.alert('Erro', getErrorMessage(error));
    }
  };

  const handleToggleAudioOnDraft = async () => {
    if (!draft) return;

    try {
      if (!isRecording) {
        await startRecording();
        return;
      }

      setProcessing(true, 'transcribing');
      const uri = await stopRecording();
      if (!uri) return;

      const location = await getCurrentLocation();
      const voiceDraft = await createVoiceDraft.mutateAsync({ uri, location });
      setDraft((prev) => (prev ? mergeVoiceIntoDraft(prev, voiceDraft) : voiceDraft));
    } catch (error) {
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      resetProcessing();
    }
  };

  const handleDueDateChange = (event: DateTimePickerEvent, selected?: Date) => {
    logDueDate('onChange', {
      type: event.type,
      platform: Platform.OS,
      selected: selected?.toISOString(),
      currentDraft: draft?.dueDate,
    });

    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowDatePicker(false);
      return;
    }
    if (event.type !== 'set') return;

    if (!selected) return;

    const onlyDate = new Date(selected);
    onlyDate.setHours(12, 0, 0, 0);
    setDraftDateOnly(onlyDate);
    setShowDatePicker(false);

    const combined = combineDateAndOptionalTime(onlyDate, draftTimeOnly);
    if (combined) {
      logDueDate('data aplicada ao draft', { iso: combined });
      setDraft((prev) => (prev ? { ...prev, dueDate: combined } : prev));
    }
  };

  const handleDueTimeChange = (event: DateTimePickerEvent, selected?: Date) => {
    logDueDate('onChange hora', {
      type: event.type,
      platform: Platform.OS,
      selected: selected?.toISOString(),
    });

    if (Platform.OS === 'android' && event.type === 'dismissed') {
      setShowTimePicker(false);
      return;
    }
    if (event.type !== 'set' || !selected) return;

    setDraftTimeOnly(selected);
    setShowTimePicker(false);

    if (!draftDateOnly) {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      setDraftDateOnly(today);
      const iso = combineDateAndOptionalTime(today, selected);
      if (iso) setDraft((prev) => (prev ? { ...prev, dueDate: iso } : prev));
      return;
    }

    const iso = combineDateAndOptionalTime(draftDateOnly, selected);
    if (iso) setDraft((prev) => (prev ? { ...prev, dueDate: iso } : prev));
  };

  const handleConfirmDraft = async () => {
    if (!draft || confirmingRef.current) return;

    const finalText = draft.transcription?.trim();
    if (!finalText) {
      Alert.alert('Texto obrigatório', 'Descreva ou grave a tarefa antes de salvar.');
      return;
    }

    logDueDate('enviando confirm', {
      dueDate: draft.dueDate,
      photos: countDraftPhotos(draft),
    });

    try {
      confirmingRef.current = true;
      setProcessing(true, 'interpreting');
      const task = await confirmDraft.mutateAsync(draft);
      setReviewVisible(false);
      setDraft(null);
      setShowDatePicker(false);
      Alert.alert('Tarefa criada', task.title);
    } catch (error) {
      logDueDate('erro no confirm', { message: getErrorMessage(error) });
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      confirmingRef.current = false;
      resetProcessing();
    }
  };

  const closeDraft = () => {
    setReviewVisible(false);
    setDraft(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setDraftDateOnly(null);
    setDraftTimeOnly(null);
  };

  const photoCount = draft ? countDraftPhotos(draft) : 0;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8">
        <View className="flex-row justify-between items-center mt-2 mb-6">
          <View>
            <Text className="text-slate-400 text-sm">Olá,</Text>
            <Text className="text-white text-xl font-bold">{user?.name ?? 'Operador'}</Text>
          </View>
          <Pressable onPress={logout}>
            <Text className="text-slate-400 text-sm">Sair</Text>
          </Pressable>
        </View>

        {stats && (
          <View className="flex-row flex-wrap gap-3 mb-8">
            <StatCard label="Hoje" value={stats.today} color="#3B82F6" />
            <StatCard label="Atrasadas" value={stats.overdue} color="#EF4444" />
            <StatCard label="Urgentes" value={stats.urgent} color="#F59E0B" />
            <StatCard label="Concluídas" value={stats.completed} color="#22C55E" />
          </View>
        )}

        <View className="items-center py-8">
          <Text className="text-white text-lg font-semibold mb-2">
            {isRecording ? 'Gravando... solte para transcrever' : 'Segure para falar'}
          </Text>
          <Text className="text-slate-500 text-sm mb-8 text-center px-4">
            A IA só organiza a tarefa quando você clicar em Salvar tarefa
          </Text>

          <RecordButton
            isRecording={isRecording}
            disabled={processingBusy}
            onPressIn={handleStartRecord}
            onPressOut={handleVoiceComplete}
          />
        </View>

        <View className="flex-row gap-3 mt-4">
          <Button title="📷 Câmera" variant="secondary" className="flex-1" onPress={handleCamera} disabled={processingBusy} />
          <Button title="🖼️ Galeria" variant="secondary" className="flex-1" onPress={handleGallery} disabled={processingBusy} />
        </View>

        <Button
          title={showTextInput ? 'Ocultar texto' : '✏️ Digitar tarefa'}
          variant="ghost"
          className="mt-3"
          onPress={() => setShowTextInput((v) => !v)}
        />

        {showTextInput && (
          <View className="mt-4 bg-surface-card rounded-2xl p-4 border border-surface-muted">
            <TextInput
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Descreva a tarefa..."
              placeholderTextColor="#64748B"
              multiline
              className="text-white min-h-[80px] mb-3"
              style={{ textAlignVertical: 'top' }}
            />
            <Button title="Adicionar ao rascunho" onPress={handleTextSubmit} />
          </View>
        )}

        <Button
          title="Ver todas as tarefas →"
          variant="ghost"
          className="mt-6"
          onPress={() => navigation.navigate('Tasks')}
        />
      </ScrollView>

      <LoadingOverlay visible={isProcessing} message={processingMessage || 'Processando...'} />

      <Modal visible={reviewVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <View className="flex-1 bg-black/80 pt-16 px-4 pb-2">
            <View className="bg-surface-card border border-surface-muted rounded-2xl flex-1 max-h-[92%] p-4">
              <Text className="text-white text-lg font-bold mb-1">Revise antes de salvar</Text>
              <Text className="text-slate-400 mb-3">
                Áudio vira texto · Imagem é só anexo · IA interpreta ao salvar
              </Text>

              {draft && (
                <ScrollView
                  className="flex-1"
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator
                  contentContainerStyle={{ paddingBottom: 8 }}
                >
                <Text className="text-slate-300 text-xs mb-1">Texto da tarefa</Text>
                <TextInput
                  value={draft.transcription ?? ''}
                  onChangeText={(value) =>
                    setDraft((prev) => (prev ? { ...prev, transcription: value } : prev))
                  }
                  placeholder="Fale, digite ou corrija o texto aqui..."
                  placeholderTextColor="#64748B"
                  multiline
                  className="text-white border border-surface-muted rounded-xl px-3 py-2 mb-3 min-h-[120px]"
                  style={{ textAlignVertical: 'top' }}
                />

                {draft.attachments.filter((a) => a.localUri || a.url).length > 0 && (
                  <View className="mb-3">
                    <Text className="text-slate-300 text-xs mb-2">
                      Fotos anexadas ({draft.attachments.length})
                    </Text>
                    {draft.attachments.map((item) => {
                      const uri = item.localUri ?? item.url;
                      if (!uri) return null;
                      return (
                        <View key={item.id} className="mb-2">
                          <Image
                            source={{ uri }}
                            className="w-full h-40 rounded-xl mb-2 bg-surface-muted"
                            resizeMode="cover"
                          />
                          <TextInput
                            value={item.note ?? ''}
                            onChangeText={(value) =>
                              setDraft((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      attachments: prev.attachments.map((a) =>
                                        a.id === item.id ? { ...a, note: value } : a,
                                      ),
                                    }
                                  : prev,
                              )
                            }
                            placeholder="Observação da imagem (opcional)"
                            placeholderTextColor="#64748B"
                            className="text-white border border-surface-muted rounded-xl px-3 py-2"
                          />
                        </View>
                      );
                    })}
                  </View>
                )}

                {(photoCount > 0 || draft.audioReference) && (
                  <Text className="text-slate-400 text-xs mb-3">
                    {photoCount > 0 ? `${photoCount} foto(s) no rascunho` : ''}
                    {photoCount > 0 && draft.audioReference ? ' · ' : ''}
                    {draft.audioReference ? 'áudio anexado' : ''}
                  </Text>
                )}

                <Text className="text-slate-300 text-xs mb-1">Data limite</Text>
                <Pressable
                  className="border border-surface-muted rounded-xl px-3 py-3 mb-3"
                  onPress={() => {
                    logDueDate('abrindo picker', { current: draft.dueDate });
                    setShowDatePicker(true);
                  }}
                >
                  <Text className={draft.dueDate ? 'text-white' : 'text-slate-400'}>
                    {formatDueDateDisplay(draft.dueDate)}
                  </Text>
                </Pressable>
                <Text className="text-slate-300 text-xs mb-1">Hora (opcional)</Text>
                <Pressable
                  className="border border-surface-muted rounded-xl px-3 py-3 mb-3"
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text className={draftTimeOnly ? 'text-white' : 'text-slate-400'}>
                    {formatTimeDisplay(draft.dueDate)}
                  </Text>
                </Pressable>

                {showDatePicker && (
                  <DateTimePicker
                    value={draftDateOnly ?? getDueDatePickerValue(draft.dueDate)}
                    mode="date"
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDueDateChange}
                  />
                )}
                {showTimePicker && (
                  <DateTimePicker
                    value={draftTimeOnly ?? getDueDatePickerValue(draft.dueDate)}
                    mode="time"
                    is24Hour
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDueTimeChange}
                  />
                )}

                {draft.dueDate && (
                  <Button
                    title="Remover data limite"
                    variant="ghost"
                    size="sm"
                    className="mb-3"
                    onPress={() => {
                      logDueDate('removendo data');
                      setDraftDateOnly(null);
                      setDraftTimeOnly(null);
                      setDraft((prev) => (prev ? { ...prev, dueDate: null } : prev));
                    }}
                  />
                )}

                <View className="flex-row gap-2 mb-2">
                  <Button title="📷 Câmera" variant="secondary" className="flex-1" onPress={handleCamera} />
                  <Button title="🖼️ Galeria" variant="secondary" className="flex-1" onPress={handleGallery} />
                </View>

                <Button
                  title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
                  variant={isRecording ? 'danger' : 'secondary'}
                  onPress={handleToggleAudioOnDraft}
                  loading={processingBusy && !isRecording}
                />
                </ScrollView>
              )}

              <View
                className="flex-row gap-3 pt-3 border-t border-surface-muted"
                style={{ paddingBottom: insets.bottom + 4 }}
              >
                <Button title="Cancelar" variant="ghost" className="flex-1" onPress={closeDraft} />
                <Button
                  title="Salvar tarefa"
                  className="flex-1"
                  onPress={handleConfirmDraft}
                  loading={processingBusy}
                  disabled={!draft?.transcription?.trim()}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
