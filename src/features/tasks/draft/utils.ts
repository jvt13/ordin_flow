import type { LocationData, TaskDraft } from '../../../types';

export function createEmptyDraft(location?: LocationData | null): TaskDraft {
  return {
    transcription: '',
    attachments: [],
    audioReference: null,
    dueDate: null,
    latitude: location?.latitude,
    longitude: location?.longitude,
    address: location?.address,
  };
}

export function mergeDraftText(current: string | null | undefined, addition: string | null | undefined): string {
  const parts = [current?.trim(), addition?.trim()].filter(Boolean);
  return parts.join('\n\n');
}

export function mergeVoiceIntoDraft(prev: TaskDraft, voiceDraft: TaskDraft): TaskDraft {
  return {
    ...prev,
    attachments: prev.attachments ?? [],
    transcription: mergeDraftText(prev.transcription, voiceDraft.transcription),
    audioReference: voiceDraft.audioReference ?? prev.audioReference,
    aiRawResponse: {
      ...(typeof prev.aiRawResponse === 'object' && prev.aiRawResponse !== null
        ? (prev.aiRawResponse as object)
        : {}),
      stt: (voiceDraft.aiRawResponse as { stt?: unknown })?.stt,
    },
    latitude: prev.latitude ?? voiceDraft.latitude,
    longitude: prev.longitude ?? voiceDraft.longitude,
    address: prev.address ?? voiceDraft.address,
  };
}

export function attachLocalPhotoToDraft(prev: TaskDraft | null, localUri: string): TaskDraft {
  const base = prev ?? createEmptyDraft();
  if (base.attachments.some((a) => a.localUri === localUri)) return base;
  return {
    ...base,
    attachments: [
      ...base.attachments,
      {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        localUri,
        note: '',
        createdAt: new Date().toISOString(),
      },
    ],
  };
}

export function countDraftPhotos(draft: TaskDraft): number {
  return draft.attachments.length;
}
