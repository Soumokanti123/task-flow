import React from 'react';
import { ProjectSummary } from '../../types';
import { AlertCircle } from 'lucide-react';

interface SummaryBarProps {
  summary: ProjectSummary | null;
  isLoading?: boolean;
}

export const SummaryBar: React.FC<SummaryBarProps> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-white rounded-lg border border-slate-200 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded"></div>
        ))}
      </div>
    );
  }

  const hasOverdue = summary.overdueCount > 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-white rounded-lg border border-slate-200">
      <div className="p-2.5 rounded border border-slate-100 bg-slate-50/50">
        <div className="text-2xs font-medium text-slate-500 uppercase tracking-wider">Total Tasks</div>
        <div className="text-lg font-semibold text-slate-800 mt-0.5" data-testid="total-tasks-count">
          {summary.totalTasks}
        </div>
      </div>

      <div className="p-2.5 rounded border border-slate-100 bg-slate-50/50">
        <div className="text-2xs font-medium text-slate-500 uppercase tracking-wider">To Do</div>
        <div className="text-lg font-semibold text-slate-700 mt-0.5" data-testid="todo-count">
          {summary.todoCount}
        </div>
      </div>

      <div className="p-2.5 rounded border border-slate-100 bg-slate-50/50">
        <div className="text-2xs font-medium text-slate-500 uppercase tracking-wider">In Progress</div>
        <div className="text-lg font-semibold text-slate-700 mt-0.5" data-testid="in-progress-count">
          {summary.inProgressCount}
        </div>
      </div>

      <div className="p-2.5 rounded border border-slate-100 bg-slate-50/50">
        <div className="text-2xs font-medium text-slate-500 uppercase tracking-wider">Done</div>
        <div className="text-lg font-semibold text-slate-700 mt-0.5" data-testid="done-count">
          {summary.doneCount}
        </div>
      </div>

      <div
        className={`p-2.5 rounded border ${
          hasOverdue
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-slate-50/50 border-slate-100 text-slate-600'
        }`}
        data-testid="overdue-metric-card"
      >
        <div className="flex items-center justify-between">
          <div className="text-2xs font-medium uppercase tracking-wider">Overdue</div>
          {hasOverdue && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
        </div>
        <div
          className={`text-lg font-semibold mt-0.5 ${hasOverdue ? 'text-rose-700' : 'text-slate-700'}`}
          data-testid="overdue-count"
        >
          {summary.overdueCount}
        </div>
      </div>
    </div>
  );
};
