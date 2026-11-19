import React, { useState } from 'react';
import { Task, TaskStatus } from '../../types';
import { TaskCard } from './TaskCard';
import { Plus, ArrowDown } from 'lucide-react';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onDropTask: (taskId: string, targetStatus: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask?: (status: TaskStatus) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  title,
  status,
  tasks,
  onStatusChange,
  onDropTask,
  onEditTask,
  onDeleteTask,
  onAddTask,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only reset if we're actually leaving the column container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onDropTask(taskId, status);
    }
  };

  return (
    <div
      data-testid={`column-${status}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col flex-1 min-w-[280px] rounded-xl p-3 border border-t-4 transition-all duration-150 ${getHeaderColor()} ${
        isDragOver
          ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-400/50 shadow-md'
          : 'bg-slate-100/70 border-slate-200'
      }`}
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

      <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-1 min-h-[140px]">
        {tasks.length === 0 ? (
          <div
            className={`p-8 text-center border-2 border-dashed rounded-xl transition-colors ${
              isDragOver
                ? 'border-indigo-400 bg-indigo-100/40 text-indigo-700'
                : 'border-slate-200 bg-white/40 text-slate-400'
            }`}
          >
            {isDragOver ? (
              <div className="flex flex-col items-center justify-center gap-1 font-semibold text-xs">
                <ArrowDown className="w-4 h-4 animate-bounce" />
                <span>Drop task here</span>
              </div>
            ) : (
              <p className="text-xs font-medium">No tasks in {title}</p>
            )}
          </div>
        ) : (
          <>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={onStatusChange}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
            {isDragOver && (
              <div className="p-3 text-center border-2 border-dashed border-indigo-400 bg-indigo-100/40 rounded-xl text-indigo-700 text-xs font-semibold flex items-center justify-center gap-1.5 animate-pulse">
                <ArrowDown className="w-3.5 h-3.5" />
                Drop to move to {title}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
