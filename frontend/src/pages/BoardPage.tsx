import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectApi, taskApi } from '../api/client';
import { Project, Task, TaskStatus, TaskPriority, ProjectSummary, ProjectMember } from '../types';
import { SummaryBar } from '../components/board/SummaryBar';
import { KanbanColumn } from '../components/board/KanbanColumn';
import { TaskModal } from '../components/board/TaskModal';
import { ProjectModal } from '../components/board/ProjectModal';
import { MembersModal } from '../components/board/MembersModal';
import { AiPlannerModal } from '../components/board/AiPlannerModal';
import { Button } from '../components/common/Button';
import {
  CheckSquare,
  Plus,
  LogOut,
  FolderPlus,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Users,
  Sparkles,
} from 'lucide-react';

export const BoardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);

  // Filters & sorting
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [sortDirection, setSortDirection] = useState<string>('asc');

  // Loading & error states
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultTaskStatus, setDefaultTaskStatus] = useState<TaskStatus>('TODO');

  // Load projects
  const loadProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    setErrorMessage('');
    try {
      const data = await projectApi.list();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load projects');
    } finally {
      setIsLoadingProjects(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Load board data (tasks + summary)
  const loadBoardData = useCallback(async (projectId: string) => {
    if (!projectId) return;
    setIsLoadingBoard(true);
    setErrorMessage('');
    try {
      const filterParams: any = {
        sortBy,
        direction: sortDirection,
        size: 100,
      };
      if (priorityFilter !== 'ALL') {
        filterParams.priority = priorityFilter as TaskPriority;
      }

      const [tasksRes, summaryRes, membersRes] = await Promise.all([
        projectApi.getTasks(projectId, filterParams),
        projectApi.getSummary(projectId),
        projectApi.getMembers(projectId),
      ]);

      setTasks(tasksRes.content);
      setSummary(summaryRes);
      setMembers(membersRes);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to load board tasks');
    } finally {
      setIsLoadingBoard(false);
    }
  }, [priorityFilter, sortBy, sortDirection]);

  useEffect(() => {
    if (selectedProjectId) {
      loadBoardData(selectedProjectId);
    }
  }, [selectedProjectId, loadBoardData]);

  // Status transition
  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
      await taskApi.updateStatus(taskId, newStatus);
      // Refresh summary to keep metrics accurate
      if (selectedProjectId) {
        const updatedSummary = await projectApi.getSummary(selectedProjectId);
        setSummary(updatedSummary);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update task status');
      if (selectedProjectId) loadBoardData(selectedProjectId);
    }
  };

  // Drag and drop task between columns
  const handleDropTask = (taskId: string, targetStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;
    handleStatusChange(taskId, targetStatus);
  };

  // Add member to project
  const handleAddMember = async (email: string) => {
    if (!selectedProjectId) return;
    const newMember = await projectApi.addMember(selectedProjectId, email);
    setMembers((prev) => [...prev, newMember]);
  };

  const handleAiTasksCreated = (newTasks: Task[]) => {
    setTasks((prev) => [...newTasks, ...prev]);
    if (selectedProjectId) {
      projectApi.getSummary(selectedProjectId).then(setSummary).catch(() => {});
    }
  };

  // Create or Update task
  const handleTaskSubmit = async (data: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    assigneeId?: string;
  }) => {
    if (editingTask) {
      await taskApi.update(editingTask.id, data);
    } else {
      await projectApi.createTask(selectedProjectId, data);
    }
    if (selectedProjectId) loadBoardData(selectedProjectId);
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskApi.delete(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (selectedProjectId) {
        const updatedSummary = await projectApi.getSummary(selectedProjectId);
        setSummary(updatedSummary);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  // Create project
  const handleCreateProject = async (data: { name: string; description?: string }) => {
    const newProject = await projectApi.create(data);
    setProjects((prev) => [newProject, ...prev]);
    setSelectedProjectId(newProject.id);
  };

  const openAddTask = (status: TaskStatus = 'TODO') => {
    setEditingTask(null);
    setDefaultTaskStatus(status);
    setIsTaskModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  // Group tasks by column status
  const todoTasks = tasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter((t) => t.status === 'DONE');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-5 h-5 text-slate-900" />
            <span className="text-base font-bold text-slate-900 tracking-tight">TaskFlow</span>
            <span className="text-2xs px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-600 border border-slate-200">
              Workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 font-medium">
              <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-2xs">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span>{user?.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              title="Sign Out"
              className="text-slate-600 hover:text-rose-600"
            >
              <LogOut className="w-4 h-4 mr-1" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        {/* Project Selector & Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Project:
            </label>
            {isLoadingProjects ? (
              <div className="h-9 w-48 bg-slate-100 rounded-lg animate-pulse" />
            ) : projects.length === 0 ? (
              <span className="text-sm text-slate-500 italic">No projects yet</span>
            ) : (
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-lg pl-3 pr-8 py-2 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProjectModalOpen(true)}
              className="border-dashed border-slate-300 text-slate-700 hover:border-slate-400"
            >
              <FolderPlus className="w-4 h-4 mr-1.5 text-slate-700" />
              New Project
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMembersModalOpen(true)}
              disabled={!selectedProjectId}
              className="text-slate-700 hover:bg-slate-50"
            >
              <Users className="w-4 h-4 mr-1.5 text-slate-600" />
              Members ({members.length})
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsAiModalOpen(true)}
              disabled={!selectedProjectId}
              className="border-indigo-200 text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100 hover:border-indigo-300 font-medium"
            >
              <Sparkles className="w-4 h-4 mr-1.5 text-indigo-600" />
              Plan with AI
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => openAddTask('TODO')}
              disabled={!selectedProjectId}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Error message banner if any */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => selectedProjectId && loadBoardData(selectedProjectId)}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
            </Button>
          </div>
        )}

        {/* Project Description (if present) */}
        {activeProject?.description && (
          <p className="text-xs text-slate-500 px-1 -mt-2">
            {activeProject.description}
          </p>
        )}

        {/* Summary Statistics Bar */}
        <SummaryBar summary={summary} isLoading={isLoadingBoard} />

        {/* Filter and Sort Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Filters:</span>
            </div>

            {/* Priority filter */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="flex items-center gap-1">
              <span className="text-slate-500">Sort by:</span>
              <select
                value={`${sortBy}_${sortDirection}`}
                onChange={(e) => {
                  const [field, dir] = e.target.value.split('_');
                  setSortBy(field);
                  setSortDirection(dir);
                }}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-slate-400 cursor-pointer"
              >
                <option value="dueDate_asc">Due Date (Earliest First)</option>
                <option value="dueDate_desc">Due Date (Latest First)</option>
                <option value="priority_desc">Priority (High to Low)</option>
                <option value="createdAt_desc">Recently Created</option>
              </select>
            </div>
          </div>

          <div className="text-slate-400 font-medium">
            Showing {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>

        {/* Kanban Board 3-Column Grid */}
        {isLoadingBoard ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-96 rounded-xl bg-slate-100/60 border border-slate-200 animate-pulse p-4 space-y-3"
              >
                <div className="h-6 w-24 bg-slate-200 rounded" />
                <div className="h-24 bg-slate-200 rounded-lg" />
                <div className="h-24 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-2xs">
            <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mx-auto mb-3">
              <FolderPlus className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">No projects yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Create your first project to start tracking sprints, features, and team tasks.
            </p>
            <Button
              className="mt-4"
              onClick={() => setIsProjectModalOpen(true)}
            >
              <FolderPlus className="w-4 h-4 mr-1.5" /> Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <KanbanColumn
              title="To Do"
              status="TODO"
              tasks={todoTasks}
              onStatusChange={handleStatusChange}
              onDropTask={handleDropTask}
              onEditTask={openEditTask}
              onDeleteTask={handleDeleteTask}
              onAddTask={openAddTask}
            />
            <KanbanColumn
              title="In Progress"
              status="IN_PROGRESS"
              tasks={inProgressTasks}
              onStatusChange={handleStatusChange}
              onDropTask={handleDropTask}
              onEditTask={openEditTask}
              onDeleteTask={handleDeleteTask}
              onAddTask={openAddTask}
            />
            <KanbanColumn
              title="Done"
              status="DONE"
              tasks={doneTasks}
              onStatusChange={handleStatusChange}
              onDropTask={handleDropTask}
              onEditTask={openEditTask}
              onDeleteTask={handleDeleteTask}
              onAddTask={openAddTask}
            />
          </div>
        )}
      </main>

      {/* Task Modal (Create & Edit) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleTaskSubmit}
        initialTask={editingTask}
        defaultStatus={defaultTaskStatus}
        members={members}
      />

      {/* Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />

      {/* Project Members Modal */}
      <MembersModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        members={members}
        onAddMember={handleAddMember}
      />

      {/* AI Task Planner Modal */}
      <AiPlannerModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        projectId={selectedProjectId}
        projectName={activeProject?.name || 'Project'}
        members={members}
        onTasksCreated={handleAiTasksCreated}
      />
    </div>
  );
};

