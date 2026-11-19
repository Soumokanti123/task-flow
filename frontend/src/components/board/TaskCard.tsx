import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types';
import { PriorityBadge } from '../common/Badge';
import { Calendar, User as UserIcon, Edit2, Trash2, AlertCircle, GripVertical } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const isOverdue = React.useMemo(() => {
    if (!task.dueDate || task.status === 'DONE') return false;
    const due = new Date(task.dueDate + 'T23:59:59');
    return due < new Date();
  }, [task.dueDate, task.status]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      data-testid={`task-card-${task.id}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`group relative p-4 rounded-xl border bg-white shadow-sm hover:shadow transition-all cursor-grab active:cursor-grabbing select-none ${
        isDragging
          ? 'opacity-40 scale-[0.98] border-dashed border-indigo-400 shadow-none'
          : isOverdue
          ? 'border-rose-400 bg-rose-50/20 ring-1 ring-rose-300'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-300 group-hover:text-slate-500 transition-colors cursor-grab" title="Drag to move task">
            <GripVertical className="w-4 h-4 -ml-1" />
          </span>
          <PriorityBadge priority={task.priority} />
          {isOverdue && (
            <span
              data-testid="overdue-tag"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200"
            >
              <AlertCircle className="w-3 h-3 text-rose-600" />
              Overdue
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            title="Edit task"
            className="p-1 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            title="Delete task"
            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <h4 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
        {task.title}
      </h4>

      {task.description && (
        <p className="mt-1 text-xs text-slate-600 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 ${
                isOverdue ? 'text-rose-600 font-medium' : 'text-slate-500'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {task.dueDate}
            </span>
          )}

          <span className="inline-flex items-center gap-1 text-slate-500 truncate max-w-[110px]" title={task.assignee?.name || 'Unassigned'}>
            <UserIcon className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{task.assignee ? task.assignee.name : 'Unassigned'}</span>
          </span>
        </div>

        {/* Status dropdown fallback for accessible / mobile usage */}
        <select
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Change status"
          className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded px-2 py-1 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
        </select>
      </div>
    </div>
  );
};
