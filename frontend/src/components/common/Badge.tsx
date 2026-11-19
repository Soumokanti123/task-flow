import React from 'react';
import { TaskPriority, TaskStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'low' | 'medium' | 'high' | 'todo' | 'in_progress' | 'done' | 'overdue' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high: 'bg-rose-50 text-rose-700 border-rose-200',
    todo: 'bg-slate-100 text-slate-700 border-slate-300',
    in_progress: 'bg-sky-50 text-sky-700 border-sky-200',
    done: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    overdue: 'bg-red-100 text-red-800 border-red-300 font-semibold',
    default: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const map: Record<TaskPriority, 'low' | 'medium' | 'high'> = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
  };
  return <Badge variant={map[priority]}>{priority}</Badge>;
};

export const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const labelMap: Record<TaskStatus, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
  };
  const variantMap: Record<TaskStatus, 'todo' | 'in_progress' | 'done'> = {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    DONE: 'done',
  };
  return <Badge variant={variantMap[status]}>{labelMap[status]}</Badge>;
};
