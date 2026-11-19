import React from 'react';
import { TaskPriority, TaskStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'low' | 'medium' | 'high' | 'todo' | 'in_progress' | 'done' | 'overdue' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variantStyles = {
    low: 'bg-slate-100 text-slate-600 border-slate-200',
    medium: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
    high: 'bg-rose-50 text-rose-700 border-rose-200 font-medium',
    todo: 'bg-slate-100 text-slate-600 border-slate-200',
    in_progress: 'bg-slate-100 text-slate-800 border-slate-300',
    done: 'bg-slate-100 text-slate-600 border-slate-200',
    overdue: 'bg-rose-50 text-rose-700 border-rose-200 font-medium',
    default: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${variantStyles[variant]} ${className}`}
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
