import { useRef } from 'react';
import { useCaptureStore, type VoiceProcessingStage } from '../store';

const STAGE_DELAYS_MS: Array<{ delay: number; stage: VoiceProcessingStage }> = [
  { delay: 1200, stage: 'transcribing' },
  { delay: 5000, stage: 'interpreting' },
  { delay: 9000, stage: 'drafting' },
];

export function useVoiceStageProgress() {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const setProcessing = useCaptureStore((s) => s.setProcessing);

  const start = () => {
    clear();
    setProcessing(true, 'uploading');
    for (const { delay, stage } of STAGE_DELAYS_MS) {
      timersRef.current.push(
        setTimeout(() => setProcessing(true, stage), delay),
      );
    }
  };

  const clear = () => {
    for (const timer of timersRef.current) {
      clearTimeout(timer);
    }
    timersRef.current = [];
  };

  return { start, clear };
}
