// tests/setup.ts
import { jest } from "@jest/globals";

// Centralized mock objects for models
export const mockUser = {
  id: "user-123",
  name: "Aly Mohamed",
  email: "aly@example.com",
  password: process.env.TEST_DB_PASSWORD || "dummy_test_password",
  validPassword: jest.fn<() => Promise<boolean>>().mockResolvedValue(true),
};

export const mockProject = {
  id: "project-123",
  userId: "user-123",
  name: "Alpha Project",
  description: "Main project",
  save: jest.fn<() => Promise<any>>().mockResolvedValue(true),
  destroy: jest.fn<() => Promise<any>>().mockResolvedValue(true),
};

export const mockTask = {
  id: "task-123",
  name: "Build API",
  description: "Setup REST endpoints",
  status: "TODO",
  priority: "MEDIUM",
  projectId: "project-123",
  estimatedTime: 120,
  dueDate: new Date("2026-08-20T00:00:00.000Z"),
  save: jest.fn<() => Promise<any>>().mockResolvedValue(true),
  destroy: jest.fn<() => Promise<any>>().mockResolvedValue(true),
};

export const mockTimeEntry = {
  id: "entry-123",
  taskId: "task-123",
  durationMinutes: 60,
  entryDate: new Date("2026-08-11T00:00:00.000Z"),
  note: "Initial setup",
  save: jest.fn<() => Promise<any>>().mockResolvedValue(true),
  destroy: jest.fn<() => Promise<any>>().mockResolvedValue(true),
};

export const mockTaskHistory = {
  id: "history-123",
  taskId: "task-123",
  actorId: "user-123",
  fieldChanged: "status",
  oldValue: "TODO",
  newValue: "IN_PROGRESS",
};
