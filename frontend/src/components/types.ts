export type Priority = "high" | "medium" | "low";
export type Status = "todo" | "in-progress" | "in-review" | "done";

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
  { key: "todo", label: "To do" },
  { key: "in-progress", label: "In progress" },
  { key: "in-review", label: "In review" },
  { key: "done", label: "Done" },
];
