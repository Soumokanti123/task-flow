import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskCard } from '../components/board/TaskCard';
import { Task } from '../types';

describe('TaskCard Component', () => {
  const baseTask: Task = {
    id: 'task-101',
    title: 'Implement OAuth Login',
    description: 'Add Google and GitHub OAuth providers',
    status: 'TODO',
    priority: 'HIGH',
    dueDate: '2026-12-31',
    projectId: 'proj-1',
    assignee: {
      id: 'user-1',
      name: 'Alex Developer',
      email: 'alex@example.com',
      createdAt: '2026-01-01T00:00:00Z',
    },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  it('renders task details, priority and assignee', () => {
    const onStatusChange = vi.fn();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <TaskCard
        task={baseTask}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Implement OAuth Login')).toBeInTheDocument();
    expect(screen.getByText('Add Google and GitHub OAuth providers')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('Alex Developer')).toBeInTheDocument();
    expect(screen.queryByTestId('overdue-tag')).not.toBeInTheDocument();
  });

  it('displays overdue badge when due date is in the past and task is not done', () => {
    const overdueTask: Task = {
      ...baseTask,
      dueDate: '2020-01-01',
      status: 'TODO',
    };

    render(
      <TaskCard
        task={overdueTask}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByTestId('overdue-tag')).toBeInTheDocument();
  });

  it('calls onStatusChange when selecting a new status', () => {
    const onStatusChange = vi.fn();

    render(
      <TaskCard
        task={baseTask}
        onStatusChange={onStatusChange}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const select = screen.getByLabelText('Change status');
    fireEvent.change(select, { target: { value: 'IN_PROGRESS' } });

    expect(onStatusChange).toHaveBeenCalledWith('task-101', 'IN_PROGRESS');
  });

  it('is draggable and sets taskId on dragStart', () => {
    render(
      <TaskCard
        task={baseTask}
        onStatusChange={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const card = screen.getByTestId('task-card-task-101');
    expect(card).toHaveAttribute('draggable', 'true');

    const setData = vi.fn();
    fireEvent.dragStart(card, {
      dataTransfer: { setData, effectAllowed: '' },
    });
    expect(setData).toHaveBeenCalledWith('text/plain', 'task-101');
  });
});

