import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../components/ui';
import { useAuthStore } from '../store';
import { getErrorMessage } from '../services/api';
import type { AuthStackParamList } from '../navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('demo@agenda.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (error) {
      Alert.alert('Erro', getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-8">
          <Text className="text-white text-3xl font-bold mb-2">Agenda Inteligente</Text>
          <Text className="text-slate-400 mb-8">Captura operacional em segundos</Text>

          <Input label="E-mail" value={email} onChangeText={setEmail} placeholder="seu@email.com" />
          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••"
            secureTextEntry
          />

          <Button title="Entrar" onPress={handleLogin} loading={loading} className="mt-2" />

          <Pressable onPress={() => navigation.navigate('Register')} className="mt-6 items-center">
            <Text className="text-primary-light">Criar conta</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
