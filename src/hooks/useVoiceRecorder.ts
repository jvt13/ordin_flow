import { useCallback, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export function useVoiceRecorder() {
  const recordingRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);

  const startRecording = useCallback(async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Permissão de microfone negada');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY,
    );

    recordingRef.current = recording;
    setIsRecording(true);
    setDuration(0);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    const recording = recordingRef.current;
    if (!recording) return null;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const uri = recording.getURI();
    recordingRef.current = null;
    return uri;
  }, []);

  const cancelRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    recordingRef.current = null;
  }, []);

  return {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
