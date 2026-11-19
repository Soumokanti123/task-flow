export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  projectId: string;
  assignee?: User | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  projectId: string;
  totalTasks: number;
  todoCount: number;
  inProgressCount: number;
  doneCount: number;
  overdueCount: number;
}

export type ProjectRole = 'OWNER' | 'MEMBER';

export interface ProjectMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: ProjectRole;
  joinedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string>;
}

