import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/ui';
import {
  useSystemHealth,
  useSystemSettingAudit,
  useSystemSettings,
  useUpdateSystemSettings,
} from '../hooks/useSystem';
import { getErrorMessage } from '../services/api';
import type { SystemSetting } from '../services/system.service';

type AdminTab = 'settings' | 'health' | 'audit';

function SettingField({
  setting,
  value,
  onChange,
}: {
  setting: SystemSetting;
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <View className="mb-4">
      <Text className="text-white font-semibold mb-1">{setting.label}</Text>
      <Text className="text-slate-400 text-xs mb-2">{setting.description}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={setting.isSecret ? '••••••••' : setting.label}
        placeholderTextColor="#64748B"
        secureTextEntry={setting.isSecret && !value.includes('*')}
        autoCapitalize="none"
        autoCorrect={false}
        className="bg-surface-card text-white rounded-xl px-4 py-3 border border-surface-muted"
      />
      <Text className="text-slate-500 text-xs mt-1">
        Origem: {setting.source === 'database' ? 'banco' : setting.source === 'env' ? '.env' : 'padrão'}
      </Text>
    </View>
  );
}

function HealthBadge({ status }: { status: 'ONLINE' | 'OFFLINE' }) {
  const online = status === 'ONLINE';
  return (
    <View className={`px-3 py-1 rounded-full ${online ? 'bg-emerald-900/40' : 'bg-red-900/40'}`}>
      <Text className={`text-xs font-semibold ${online ? 'text-emerald-400' : 'text-red-400'}`}>
        {status}
      </Text>
    </View>
  );
}

export function AdminScreen() {
  const [tab, setTab] = useState<AdminTab>('settings');
  const { data: settings, isLoading, refetch, isRefetching } = useSystemSettings();
  const { data: health, refetch: refetchHealth, isRefetching: healthRefreshing } = useSystemHealth();
  const { data: audit } = useSystemSettingAudit();
  const updateSettings = useUpdateSystemSettings();
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});

  const mergedSettings = useMemo(() => {
    if (!settings) return [];
    return settings.map((setting) => ({
      ...setting,
      draftValue: draftValues[setting.key] ?? setting.value,
    }));
  }, [settings, draftValues]);

  const handleSave = useCallback(async () => {
    if (!settings) return;

    const payload = settings
      .filter((setting) => {
        const draft = draftValues[setting.key];
        return draft !== undefined && draft !== setting.value;
      })
      .map((setting) => ({
        key: setting.key,
        value: draftValues[setting.key] ?? setting.value,
      }));

    if (payload.length === 0) {
      Alert.alert('Configurações', 'Nenhuma alteração para salvar.');
      return;
    }

    try {
      await updateSettings.mutateAsync(payload);
      setDraftValues({});
      Alert.alert('Configurações', 'Configurações salvas com sucesso.');
    } catch (error) {
      Alert.alert('Erro', getErrorMessage(error));
    }
  }, [settings, draftValues, updateSettings]);

  const refreshing = isRefetching || healthRefreshing;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        className="flex-1 px-5"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refetch();
              void refetchHealth();
            }}
            tintColor="#94A3B8"
          />
        }
      >
        <Text className="text-white text-2xl font-bold mt-4 mb-2">Administração</Text>
        <Text className="text-slate-400 text-sm mb-6">
          Configurações do sistema e diagnóstico operacional
        </Text>

        <View className="flex-row gap-2 mb-6">
          {(['settings', 'health', 'audit'] as AdminTab[]).map((item) => (
            <Pressable
              key={item}
              onPress={() => setTab(item)}
              className={`px-4 py-2 rounded-full ${tab === item ? 'bg-primary' : 'bg-surface-card'}`}
            >
              <Text className={`text-sm ${tab === item ? 'text-white font-semibold' : 'text-slate-400'}`}>
                {item === 'settings' ? 'Configurações' : item === 'health' ? 'Saúde' : 'Auditoria'}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'settings' && (
          <View>
            {isLoading ? (
              <ActivityIndicator color="#3B82F6" />
            ) : (
              <>
                {mergedSettings.map((setting) => (
                  <SettingField
                    key={setting.key}
                    setting={setting}
                    value={setting.draftValue}
                    onChange={(next) =>
                      setDraftValues((prev) => ({ ...prev, [setting.key]: next }))
                    }
                  />
                ))}
                <Button
                  title={updateSettings.isPending ? 'Salvando...' : 'Salvar alterações'}
                  onPress={handleSave}
                  disabled={updateSettings.isPending}
                />
                <Text className="text-slate-500 text-xs mt-4 mb-8">
                  Alterações em GEMINI e Cloudinary entram em vigor imediatamente. WHISPER_MODEL exige
                  restart do PM2 whisper-stt na VPS.
                </Text>
              </>
            )}
          </View>
        )}

        {tab === 'health' && (
          <View className="mb-8">
            {health ? (
              <>
                <Text className="text-slate-400 text-xs mb-4">
                  Verificado em {new Date(health.checkedAt).toLocaleString('pt-BR')}
                </Text>
                {health.services.map((service) => (
                  <View
                    key={service.name}
                    className="bg-surface-card rounded-xl p-4 mb-3 border border-surface-muted flex-row justify-between items-center"
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-white font-semibold">{service.name}</Text>
                      {service.detail ? (
                        <Text className="text-slate-400 text-xs mt-1">{service.detail}</Text>
                      ) : null}
                    </View>
                    <HealthBadge status={service.status} />
                  </View>
                ))}
              </>
            ) : (
              <ActivityIndicator color="#3B82F6" />
            )}
          </View>
        )}

        {tab === 'audit' && (
          <View className="mb-8">
            {(audit ?? []).length === 0 ? (
              <Text className="text-slate-400">Nenhum registro de auditoria.</Text>
            ) : (
              audit?.map((entry) => (
                <View
                  key={entry.id}
                  className="bg-surface-card rounded-xl p-4 mb-3 border border-surface-muted"
                >
                  <Text className="text-white font-medium">{entry.settingKey}</Text>
                  <Text className="text-slate-400 text-xs mt-1">
                    {entry.action} — {entry.userEmail ?? entry.userId}
                  </Text>
                  <Text className="text-slate-500 text-xs mt-1">
                    {new Date(entry.createdAt).toLocaleString('pt-BR')}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
