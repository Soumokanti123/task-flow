import React from 'react';
import { ProjectSummary } from '../../types';
import { CheckCircle2, Clock, ListTodo, AlertTriangle, Layers } from 'lucide-react';

interface SummaryBarProps {
  summary: ProjectSummary | null;
  isLoading?: boolean;
}

export const SummaryBar: React.FC<SummaryBarProps> = ({ summary, isLoading }) => {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-white rounded-xl border border-slate-200 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 bg-slate-100 rounded-lg"></div>
        ))}
      </div>
    );
  }

  const hasOverdue = summary.overdueCount > 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
        <div className="p-2 rounded-md bg-indigo-50 text-indigo-600">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tasks</div>
          <div className="text-lg font-bold text-slate-800" data-testid="total-tasks-count">
            {summary.totalTasks}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
        <div className="p-2 rounded-md bg-slate-100 text-slate-600">
          <ListTodo className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">To Do</div>
          <div className="text-lg font-bold text-slate-700" data-testid="todo-count">
            {summary.todoCount}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
        <div className="p-2 rounded-md bg-sky-50 text-sky-600">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">In Progress</div>
          <div className="text-lg font-bold text-sky-700" data-testid="in-progress-count">
            {summary.inProgressCount}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
        <div className="p-2 rounded-md bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Done</div>
          <div className="text-lg font-bold text-emerald-700" data-testid="done-count">
            {summary.doneCount}
          </div>
        </div>
      </div>

      <div
        className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${
          hasOverdue
            ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm'
            : 'bg-slate-50 border-slate-100 text-slate-500'
        }`}
        data-testid="overdue-metric-card"
      >
        <div className={`p-2 rounded-md ${hasOverdue ? 'bg-rose-200 text-rose-700 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wider">Overdue</div>
          <div
            className={`text-lg font-bold ${hasOverdue ? 'text-rose-700' : 'text-slate-600'}`}
            data-testid="overdue-count"
          >
            {summary.overdueCount}
          </div>
        </div>
      </div>
    </div>
  );
};
