import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input } from '../components/ui';
import { useAuthStore } from '../store';
import { getErrorMessage } from '../services/api';
import type { AuthStackParamList } from '../navigation';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export function RegisterScreen({ navigation }: Props) {
  const register = useAuthStore((s) => s.register);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);
      await register(name.trim(), email.trim(), password);
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
          <Text className="text-white text-3xl font-bold mb-2">Criar conta</Text>
          <Text className="text-slate-400 mb-8">Comece a capturar tarefas por voz</Text>

          <Input label="Nome" value={name} onChangeText={setName} placeholder="Seu nome" />
          <Input label="E-mail" value={email} onChangeText={setEmail} placeholder="seu@email.com" />
          <Input
            label="Senha"
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
          />

          <Button title="Cadastrar" onPress={handleRegister} loading={loading} className="mt-2" />

          <Pressable onPress={() => navigation.goBack()} className="mt-6 items-center">
            <Text className="text-primary-light">Já tenho conta</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
