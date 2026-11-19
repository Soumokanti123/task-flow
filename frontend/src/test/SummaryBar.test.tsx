import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SummaryBar } from '../components/board/SummaryBar';
import { ProjectSummary } from '../types';

describe('SummaryBar Component', () => {
  it('renders all metrics correctly', () => {
    const mockSummary: ProjectSummary = {
      projectId: 'proj-1',
      totalTasks: 15,
      todoCount: 5,
      inProgressCount: 6,
      doneCount: 4,
      overdueCount: 2,
    };

    render(<SummaryBar summary={mockSummary} />);

    expect(screen.getByTestId('total-tasks-count')).toHaveTextContent('15');
    expect(screen.getByTestId('todo-count')).toHaveTextContent('5');
    expect(screen.getByTestId('in-progress-count')).toHaveTextContent('6');
    expect(screen.getByTestId('done-count')).toHaveTextContent('4');
    expect(screen.getByTestId('overdue-count')).toHaveTextContent('2');
  });

  it('highlights overdue metric card when overdueCount > 0', () => {
    const mockSummary: ProjectSummary = {
      projectId: 'proj-1',
      totalTasks: 8,
      todoCount: 2,
      inProgressCount: 3,
      doneCount: 3,
      overdueCount: 3,
    };

    render(<SummaryBar summary={mockSummary} />);

    const overdueCard = screen.getByTestId('overdue-metric-card');
    expect(overdueCard.className).toContain('bg-rose-50');
  });
});

