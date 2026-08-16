export type Priority = "HIGH" | "MEDIUM" | "LOW";
export type Status = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";

export interface Task {
  id: string;
  name: string;
  description: string;
  projectId: string;
  priority: Priority;
  dueDate?: string;
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
  email: string;
}

export const columns: { key: Status; label: string }[] = [
  { key: "TODO", label: "To do" },
  { key: "IN_PROGRESS", label: "In progress" },
  { key: "IN_REVIEW", label: "In review" },
  { key: "DONE", label: "Done" },
];
