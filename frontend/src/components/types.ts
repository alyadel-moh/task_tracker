export type Priority = "HIGH" | "MEDIUM" | "LOW";

export interface Task {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  priority: Priority;
  dueDate?: Date | string | null;
  estimatedTime?: number | null;
  statusId: string | null;
  statusName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  name: string;
  photoUrl?: string | null;
  email: string;
  updatedAt?: string;
}
export interface Statuss {
  id: string;
  projectId: string;
  name: string;
  position: number;
  isDefault: boolean | undefined;
}

export interface TimeEntry {
  id: string;
  taskId: string;
  note?: string;
  durationMinutes?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  eventType: string;
  fieldChanged?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
  };
}
