export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskCategory =
  | 'MAINTENANCE'
  | 'SECURITY'
  | 'ADMINISTRATIVE'
  | 'FINANCIAL'
  | 'PERSONAL'
  | 'OPERATIONAL'
  | 'OTHER';

export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  transcription: string | null;
  priority: TaskPriority;
  category: TaskCategory;
  status: TaskStatus;
  dueDate: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  imageUrls?: string[];
  attachments?: TaskAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivity {
  id: string;
  type: string;
  message: string;
  metadata?: unknown;
  createdAt: string;
}

export interface TaskDetail extends Task {
  activities: TaskActivity[];
}

export interface TaskAttachment {
  id: string;
  url: string;
  note?: string | null;
  createdAt?: string;
}

export interface DashboardStats {
  today: number;
  overdue: number;
  urgent: number;
  completed: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  search?: string;
  page?: number;
  limit?: number;
}

// Preparado para sync offline futuro
export interface PendingSyncItem {
  id: string;
  type: 'text' | 'voice' | 'photo';
  payload: unknown;
  createdAt: string;
}

export interface TaskDraft {
  transcription: string | null;
  attachments: Array<{
    id: string;
    localUri?: string;
    url?: string;
    note?: string | null;
    createdAt: string;
  }>;
  audioReference: string | null;
  dueDate?: string | null;
  aiRawResponse?: unknown;
  latitude?: number;
  longitude?: number;
  address?: string;
}
