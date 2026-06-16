import { memo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  Text,
  TextInput,
  View,
  ViewProps,
} from 'react-native';
import { cn } from '../../utils/format';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Button = memo(function Button({
  title,
  variant = 'primary',
  loading,
  size = 'md',
  disabled,
  className,
  ...props
}: ButtonProps) {
  const variants = {
    primary: 'bg-primary active:bg-primary-dark',
    secondary: 'bg-surface-muted active:opacity-80',
    danger: 'bg-danger active:opacity-80',
    ghost: 'bg-transparent border border-surface-muted',
  };

  const sizes = {
    sm: 'py-2 px-4',
    md: 'py-3 px-6',
    lg: 'py-4 px-8',
  };

  return (
    <Pressable
      className={cn(
        'rounded-2xl items-center justify-center flex-row',
        variants[variant],
        sizes[size],
        (disabled || loading) && 'opacity-50',
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />}
      <Text className="text-white font-semibold text-base">{title}</Text>
    </Pressable>
  );
});

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  className?: string;
}

export const Input = memo(function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  className,
}: InputProps) {
  return (
    <View className={cn('mb-4', className)}>
      {label && <Text className="text-slate-300 mb-2 font-medium">{label}</Text>}
      <View className="bg-surface-card rounded-xl border border-surface-muted px-4 py-3">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          className="text-white text-base min-h-[24px]"
          style={multiline ? { minHeight: 80, textAlignVertical: 'top' } : undefined}
        />
      </View>
    </View>
  );
});

interface CardProps extends ViewProps {
  className?: string;
}

export const Card = memo(function Card({ children, className, ...props }: CardProps) {
  return (
    <View className={cn('bg-surface-card rounded-2xl p-4 border border-surface-muted/50', className)} {...props}>
      {children}
    </View>
  );
});

interface StatCardProps {
  label: string;
  value: number;
  color: string;
}

export const StatCard = memo(function StatCard({ label, value, color }: StatCardProps) {
  return (
    <Card className="flex-1 min-w-[45%]">
      <Text className="text-3xl font-bold" style={{ color }}>
        {value}
      </Text>
      <Text className="text-slate-400 mt-1 text-sm">{label}</Text>
    </Card>
  );
});

interface BadgeProps {
  label: string;
  color?: string;
}

export const Badge = memo(function Badge({ label, color = '#64748B' }: BadgeProps) {
  return (
    <View className="px-2 py-1 rounded-lg" style={{ backgroundColor: `${color}22` }}>
      <Text className="text-xs font-semibold" style={{ color }}>
        {label}
      </Text>
    </View>
  );
});

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export const LoadingOverlay = memo(function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  if (!visible) return null;
  return (
    <View className="absolute inset-0 bg-black/70 items-center justify-center z-50">
      <View className="bg-surface-card p-6 rounded-2xl items-center">
        <ActivityIndicator size="large" color="#2563EB" />
        {message && <Text className="text-white mt-4 text-center">{message}</Text>}
      </View>
    </View>
  );
});
