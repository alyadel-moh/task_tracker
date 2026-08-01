export type Priority = "high" | "medium" | "low";
export type Status = "todo" | "in_progress" | "in_review" | "done";

export interface Task {
  id: string;
  projectId: string;
  name: string;
  priority: Priority;
  dueDate?: string;
  estimate?: string;
  status: Status;
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
  { key: "in_progress", label: "In progress" },
  { key: "in_review", label: "In review" },
  { key: "done", label: "Done" },
];
