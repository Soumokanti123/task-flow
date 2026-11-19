import React from 'react';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask?: (status: TaskStatus) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  tasks,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  onAddTask,
}) => {
  const getHeaderColor = () => {
    switch (status) {
      case 'TODO':
        return 'border-t-slate-400';
      case 'IN_PROGRESS':
        return 'border-t-sky-500';
      case 'DONE':
        return 'border-t-emerald-500';
    }
  };

  return (
    <div
      data-testid={`column-${status}`}
      className={`flex flex-col flex-1 min-w-[280px] bg-slate-100/70 rounded-xl p-3 border border-slate-200 border-t-4 ${getHeaderColor()}`}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-slate-800">{title}</h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-slate-600 border border-slate-200 shadow-2xs">
            {tasks.length}
          </span>
        </div>
        {onAddTask && (
          <button
            onClick={() => onAddTask(status)}
            className="p-1 text-slate-500 hover:text-indigo-600 rounded hover:bg-white transition-colors"
            title={`Add task to ${title}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
        {tasks.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white/40">
            <p className="text-xs text-slate-400 font-medium">No tasks in {title}</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
            />
          ))
        )}
      </div>
    </div>
  );
};
