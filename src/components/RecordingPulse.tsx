import { memo, useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';

interface RecordingPulseProps {
  active: boolean;
}

export const RecordingPulse = memo(function RecordingPulse({ active }: RecordingPulseProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!active) return;

    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.2, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
        ]),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [active, scale, opacity]);

  if (!active) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#EF4444',
        opacity,
        transform: [{ scale }],
      }}
    />
  );
});

interface RecordButtonProps {
  onPressIn: () => void;
  onPressOut: () => void;
  isRecording: boolean;
  disabled?: boolean;
}

export const RecordButton = memo(function RecordButton({
  onPressIn,
  onPressOut,
  isRecording,
  disabled,
}: RecordButtonProps) {
  return (
    <View className="items-center justify-center">
      <RecordingPulse active={isRecording} />
      <Pressable
        onPressIn={disabled ? undefined : onPressIn}
        onPressOut={disabled ? undefined : onPressOut}
        disabled={disabled}
        className={`w-28 h-28 rounded-full items-center justify-center ${
          isRecording ? 'bg-danger' : 'bg-primary'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <View className={`${isRecording ? 'w-8 h-8 rounded-sm bg-white' : 'w-12 h-12 rounded-full bg-white/90'}`} />
      </Pressable>
    </View>
  );
});
