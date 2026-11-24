import axios from 'axios';
import {
  AuthResponse,
  Project,
  ProjectMember,
  ProjectSummary,
  Task,
  TaskStatus,
  TaskPriority,
  PageResponse,
  AiPlanResponse,
} from '../types';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      window.dispatchEvent(new Event('taskflow_unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: async (data: { name: string; email: string; password: string }) => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },
  login: async (data: { email: string; password: string }) => {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },
};

export const projectApi = {
  list: async () => {
    const res = await apiClient.get<Project[]>('/projects');
    return res.data;
  },
  create: async (data: { name: string; description?: string }) => {
    const res = await apiClient.post<Project>('/projects', data);
    return res.data;
  },
  getSummary: async (projectId: string) => {
    const res = await apiClient.get<ProjectSummary>(`/projects/${projectId}/summary`);
    return res.data;
  },
  getTasks: async (
    projectId: string,
    params?: {
      status?: TaskStatus;
      priority?: TaskPriority;
      assigneeId?: string;
      sortBy?: string;
      direction?: string;
      page?: number;
      size?: number;
    }
  ) => {
    const res = await apiClient.get<PageResponse<Task>>(`/projects/${projectId}/tasks`, {
      params,
    });
    return res.data;
  },
  createTask: async (
    projectId: string,
    data: {
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: string;
      assigneeId?: string;
    }
  ) => {
    const res = await apiClient.post<Task>(`/projects/${projectId}/tasks`, data);
    return res.data;
  },
  getMembers: async (projectId: string) => {
    const res = await apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`);
    return res.data;
  },
  addMember: async (projectId: string, email: string) => {
    const res = await apiClient.post<ProjectMember>(`/projects/${projectId}/members`, { email });
    return res.data;
  },
  createTasksBatch: async (
    projectId: string,
    tasks: {
      title: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      dueDate?: string;
      assigneeId?: string;
    }[]
  ) => {
    const res = await apiClient.post<Task[]>(`/projects/${projectId}/tasks/batch`, { tasks });
    return res.data;
  },
};

export const aiApi = {
  generatePlan: async (
    projectId: string,
    data: {
      prompt: string;
      sprintDurationDays?: number;
      targetTaskCount?: number;
    }
  ): Promise<AiPlanResponse> => {
    const res = await apiClient.post<AiPlanResponse>(`/projects/${projectId}/ai/generate-plan`, data);
    return res.data;
  },
};

export const taskApi = {
  update: async (
    taskId: string,
    data: {
      title: string;
      description?: string;
      status: TaskStatus;
      priority: TaskPriority;
      dueDate?: string;
      assigneeId?: string;
    }
  ) => {
    const res = await apiClient.put<Task>(`/tasks/${taskId}`, data);
    return res.data;
  },
  updateStatus: async (taskId: string, status: TaskStatus) => {
    const res = await apiClient.patch<Task>(`/tasks/${taskId}/status`, { status });
    return res.data;
  },
  delete: async (taskId: string) => {
    await apiClient.delete(`/tasks/${taskId}`);
  },
};

