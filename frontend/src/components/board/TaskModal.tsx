import React, { useState, useEffect } from 'react';
import { ProjectMember, Task, TaskPriority, TaskStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate?: string;
    assigneeId?: string;
  }) => Promise<void>;
  initialTask?: Task | null;
  defaultStatus?: TaskStatus;
  members?: ProjectMember[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialTask,
  defaultStatus = 'TODO',
  members = [],
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setStatus(initialTask.status);
      setPriority(initialTask.priority);
      setDueDate(initialTask.dueDate || '');
      setAssigneeId(initialTask.assignee?.id || '');
    } else {
      setTitle('');
      setDescription('');
      setStatus(defaultStatus);
      setPriority('MEDIUM');
      setDueDate('');
      setAssigneeId('');
    }
    setErrors({});
  }, [initialTask, defaultStatus, isOpen]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) {
      errs.title = 'Title is required';
    } else if (title.trim().length > 120) {
      errs.title = 'Title must not exceed 120 characters';
    }

    if (!initialTask && dueDate) {
      const selected = new Date(dueDate + 'T23:59:59');
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      if (selected < now) {
        errs.dueDate = 'Due date cannot be in the past on creation';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        dueDate: dueDate || undefined,
        assigneeId: assigneeId || undefined,
      });
      onClose();
    } catch (err: any) {
      if (err.response?.data?.fieldErrors) {
        setErrors(err.response.data.fieldErrors);
      } else if (err.response?.data?.message) {
        setErrors({ general: err.response.data.message });
      } else {
        setErrors({ general: 'Failed to save task. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialTask ? 'Edit Task' : 'Create New Task'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.general && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {errors.general}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Implement user login flow"
            maxLength={120}
            className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 ${
              errors.title
                ? 'border-rose-400 focus:ring-rose-200'
                : 'border-slate-300 focus:ring-slate-400 focus:border-slate-400'
            }`}
          />
          <div className="flex justify-between items-center mt-1">
            {errors.title ? (
              <span className="text-xs text-rose-600 font-medium">{errors.title}</span>
            ) : <span />}
            <span className="text-2xs text-slate-400">{title.length}/120</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Additional context or acceptance criteria..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 bg-white"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 bg-white"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 ${
                errors.dueDate
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-slate-400 focus:border-slate-400'
              }`}
            />
            {errors.dueDate && (
              <span className="block text-xs text-rose-600 mt-1 font-medium">
                {errors.dueDate}
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assignee
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 bg-white cursor-pointer"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {initialTask ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
