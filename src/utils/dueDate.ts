/** Logs temporários para diagnóstico do date picker */
export function logDueDate(message: string, meta?: Record<string, unknown>) {
  if (meta) {
    console.log(`[DUE_DATE] ${message}`, meta);
  } else {
    console.log(`[DUE_DATE] ${message}`);
  }
}

export function toIsoDueDate(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function parseDueDateInput(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function formatDueDateDisplay(value: string | null | undefined): string {
  const parsed = parseDueDateInput(value);
  if (!parsed) return 'Selecionar no calendário';
  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getDueDatePickerValue(value: string | null | undefined): Date {
  return parseDueDateInput(value) ?? new Date();
}

export function formatTimeDisplay(value: string | null | undefined): string {
  const parsed = parseDueDateInput(value);
  if (!parsed) return 'Definir hora (opcional)';
  return parsed.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function combineDateAndOptionalTime(datePart: Date, timePart?: Date | null): string | null {
  if (Number.isNaN(datePart.getTime())) return null;

  const base = new Date(datePart);
  if (timePart && !Number.isNaN(timePart.getTime())) {
    base.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
  } else {
    // sem hora definida: mantém apenas data no meio-dia para evitar shift de timezone
    base.setHours(12, 0, 0, 0);
  }
  return toIsoDueDate(base);
}
