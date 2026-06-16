const PRODUCTION_API_URL = 'https://api-ordin.srv-jvt.com';

/** Em release (APK), sempre a API de producao — evita fallback para IP local. */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? 'http://10.0.2.2:3333' : PRODUCTION_API_URL);

export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
  CANCELED: 'CANCELED',
} as const;

export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

export const TASK_CATEGORY = {
  MAINTENANCE: 'MAINTENANCE',
  SECURITY: 'SECURITY',
  ADMINISTRATIVE: 'ADMINISTRATIVE',
  FINANCIAL: 'FINANCIAL',
  PERSONAL: 'PERSONAL',
  OPERATIONAL: 'OPERATIONAL',
  OTHER: 'OTHER',
} as const;

export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  DONE: 'Concluída',
  CANCELED: 'Cancelada',
};

export const CATEGORY_LABELS: Record<string, string> = {
  MAINTENANCE: 'Manutenção',
  SECURITY: 'Segurança',
  ADMINISTRATIVE: 'Administrativo',
  FINANCIAL: 'Financeiro',
  PERSONAL: 'Pessoal',
  OPERATIONAL: 'Operacional',
  OTHER: 'Outro',
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: '#64748B',
  MEDIUM: '#3B82F6',
  HIGH: '#F59E0B',
  URGENT: '#EF4444',
};
