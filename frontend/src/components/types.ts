export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type Status = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";

export interface Task {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  priority: Priority;
  dueDate?: Date | string | null;
  estimatedTime?: number | null;
  status: Status;
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

export const columns: { key: Status; label: string }[] = [
  { key: "TODO", label: "To do" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "IN_REVIEW", label: "In review" },
  { key: "DONE", label: "Done" },
];
