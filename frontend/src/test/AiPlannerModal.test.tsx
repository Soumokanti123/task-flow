import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiPlannerModal } from '../components/board/AiPlannerModal';
import { aiApi, projectApi } from '../api/client';
import { ProjectMember } from '../types';

vi.mock('../api/client', () => ({
  aiApi: {
    generatePlan: vi.fn(),
  },
  projectApi: {
    createTasksBatch: vi.fn(),
  },
}));

describe('AiPlannerModal Component', () => {
  const mockMembers: ProjectMember[] = [
    {
      id: 'm1',
      userId: 'u1',
      name: 'Soumo Bera',
      email: 'soumo@taskflow.dev',
      role: 'OWNER',
      joinedAt: '2026-01-01',
    },
    {
      id: 'm2',
      userId: 'u2',
      name: 'Alex Johnson',
      email: 'alex@taskflow.dev',
      role: 'MEMBER',
      joinedAt: '2026-01-02',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    render(
      <AiPlannerModal
        isOpen={false}
        onClose={vi.fn()}
        projectId="p1"
        projectName="Test Project"
        members={mockMembers}
        onTasksCreated={vi.fn()}
      />
    );

    expect(screen.queryByText('AI Task Planner')).not.toBeInTheDocument();
  });

  it('renders prompt input and starter chips when open', () => {
    render(
      <AiPlannerModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="p1"
        projectName="Test Project"
        members={mockMembers}
        onTasksCreated={vi.fn()}
      />
    );

    expect(screen.getByText('AI Task Planner')).toBeInTheDocument();
    expect(screen.getByText('🚀 MVP Launch')).toBeInTheDocument();
    expect(screen.getByText('🔐 Auth & Security')).toBeInTheDocument();
  });

  it('populates textarea when clicking a starter chip', () => {
    render(
      <AiPlannerModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="p1"
        projectName="Test Project"
        members={mockMembers}
        onTasksCreated={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('🔐 Auth & Security'));
    const textarea = screen.getByPlaceholderText(/e\.g\. Build an automated/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('JWT authentication');
  });

  it('generates plan and shows task review list', async () => {
    vi.mocked(aiApi.generatePlan).mockResolvedValueOnce({
      planSummary: 'Plan for JWT Authentication sprint',
      suggestedTasks: [
        {
          title: 'Design Security Filter',
          description: 'Build JwtAuthenticationFilter',
          priority: 'HIGH',
          dueDate: '2026-12-01',
          suggestedAssigneeEmail: 'soumo@taskflow.dev',
          suggestedAssigneeId: 'u1',
          suggestedAssigneeName: 'Soumo Bera',
        },
      ],
    });

    render(
      <AiPlannerModal
        isOpen={true}
        onClose={vi.fn()}
        projectId="p1"
        projectName="Test Project"
        members={mockMembers}
        onTasksCreated={vi.fn()}
      />
    );

    const textarea = screen.getByPlaceholderText(/e\.g\. Build an automated/i);
    fireEvent.change(textarea, { target: { value: 'Build auth' } });

    fireEvent.click(screen.getByRole('button', { name: /generate plan/i }));

    await waitFor(() => {
      expect(screen.getByText('Plan for JWT Authentication sprint')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Design Security Filter')).toBeInTheDocument();
    });
  });
});
