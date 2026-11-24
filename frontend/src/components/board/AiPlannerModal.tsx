import React, { useState } from 'react';
import { ProjectMember, Task, TaskPriority, AiTaskSuggestion } from '../../types';
import { aiApi, projectApi } from '../../api/client';
import { Button } from '../common/Button';
import {
  Sparkles,
  Calendar,
  User as UserIcon,
  CheckSquare,
  Square,
  RotateCcw,
  Check,
  AlertCircle,
  X,
  Wand2,
} from 'lucide-react';

interface AiPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  members: ProjectMember[];
  onTasksCreated: (createdTasks: Task[]) => void;
}

interface EditableSuggestion extends AiTaskSuggestion {
  tempId: string;
  selected: boolean;
}

const STARTER_PROMPTS = [
  { label: '🚀 MVP Launch', text: 'Plan an MVP launch with landing page, core feature onboarding, and analytics.' },
  { label: '🔐 Auth & Security', text: 'Implement JWT authentication, refresh tokens, role-based authorization, and security audit.' },
  { label: '⚡ Docker & CI/CD', text: 'Containerize backend and frontend with Docker Compose, Nginx reverse proxy, and GitHub Actions CI.' },
  { label: '💳 Stripe Billing', text: 'Build subscription pricing tiers, Stripe Checkout session, and webhook handling.' },
  { label: '🧪 Test Suite', text: 'Write MockK service unit tests, React Testing Library component tests, and E2E automation.' },
];

export const AiPlannerModal: React.FC<AiPlannerModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  members,
  onTasksCreated,
}) => {
  const [step, setStep] = useState<'prompt' | 'review'>('prompt');
  const [prompt, setPrompt] = useState('');
  const [sprintDurationDays, setSprintDurationDays] = useState(14);
  const [targetTaskCount, setTargetTaskCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [planSummary, setPlanSummary] = useState('');
  const [suggestions, setSuggestions] = useState<EditableSuggestion[]>([]);

  if (!isOpen) return null;

  const handleGeneratePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) {
      setError('Please provide a goal or feature description for the AI.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await aiApi.generatePlan(projectId, {
        prompt: prompt.trim(),
        sprintDurationDays,
        targetTaskCount,
      });

      setPlanSummary(response.planSummary);
      setSuggestions(
        response.suggestedTasks.map((t, idx) => ({
          ...t,
          tempId: `ai-temp-${Date.now()}-${idx}`,
          selected: true,
        }))
      );
      setStep('review');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate plan with AI. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (tempId: string) => {
    setSuggestions((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleToggleSelectAll = () => {
    const allSelected = suggestions.every((s) => s.selected);
    setSuggestions((prev) => prev.map((s) => ({ ...s, selected: !allSelected })));
  };

  const handleUpdateTaskField = (tempId: string, field: keyof AiTaskSuggestion, value: any) => {
    setSuggestions((prev) =>
      prev.map((item) => {
        if (item.tempId !== tempId) return item;
        if (field === 'suggestedAssigneeId') {
          const matched = members.find((m) => m.userId === value);
          return {
            ...item,
            suggestedAssigneeId: value || undefined,
            suggestedAssigneeEmail: matched?.email,
            suggestedAssigneeName: matched?.name,
          };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const handleBatchCreate = async () => {
    const selectedTasks = suggestions.filter((s) => s.selected);
    if (selectedTasks.length === 0) {
      setError('Please select at least one task to create.');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const payload = selectedTasks.map((t) => ({
        title: t.title.trim(),
        description: t.description?.trim(),
        priority: t.priority,
        status: 'TODO' as const,
        dueDate: t.dueDate || undefined,
        assigneeId: t.suggestedAssigneeId || undefined,
      }));

      const created = await projectApi.createTasksBatch(projectId, payload);
      onTasksCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create tasks on the board.');
    } finally {
      setCreating(false);
    }
  };

  const selectedCount = suggestions.filter((s) => s.selected).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl p-6 border border-slate-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">AI Task Planner</h3>
                <p className="text-xs text-slate-500">
                  Plan tasks and sprint milestones for <span className="font-medium text-slate-700">{projectName}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mt-3.5 flex items-center gap-2 p-2.5 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: PROMPT INPUT */}
          {step === 'prompt' && (
            <form onSubmit={handleGeneratePlan} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  What goal or feature do you want to plan?
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  required
                  placeholder="e.g. Build an automated end-to-end payment flow using Stripe Checkout with webhooks and customer receipts."
                  className="w-full text-sm border border-slate-300 rounded-lg p-3 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Starter Chips */}
              <div>
                <p className="text-xs text-slate-500 mb-1.5 font-medium">Quick Starters:</p>
                <div className="flex flex-wrap gap-1.5">
                  {STARTER_PROMPTS.map((starter) => (
                    <button
                      key={starter.label}
                      type="button"
                      onClick={() => setPrompt(starter.text)}
                      className="px-2.5 py-1 text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-full border border-slate-200 transition-colors"
                    >
                      {starter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameters */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Sprint Duration (Days)
                  </label>
                  <select
                    value={sprintDurationDays}
                    onChange={(e) => setSprintDurationDays(Number(e.target.value))}
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white"
                  >
                    <option value={7}>1 Week (7 Days)</option>
                    <option value={14}>2 Weeks (14 Days)</option>
                    <option value={21}>3 Weeks (21 Days)</option>
                    <option value={30}>1 Month (30 Days)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Target Task Count
                  </label>
                  <select
                    value={targetTaskCount}
                    onChange={(e) => setTargetTaskCount(Number(e.target.value))}
                    className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 bg-white"
                  >
                    <option value={3}>3 Milestones</option>
                    <option value={4}>4 Tasks</option>
                    <option value={5}>5 Tasks (Recommended)</option>
                    <option value={7}>7 Tasks</option>
                  </select>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="gap-1.5">
                  {loading ? (
                    <>
                      <Wand2 className="w-4 h-4 animate-spin" />
                      Analyzing & Planning...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Plan
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* STEP 2: REVIEW & CUSTOMIZE */}
          {step === 'review' && (
            <div className="mt-4 space-y-4">
              {/* Summary Banner */}
              <div className="p-3 bg-gradient-to-r from-indigo-50/70 to-slate-50 border border-indigo-100 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">
                      AI Sprint Breakdown
                    </h4>
                    <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{planSummary}</p>
                  </div>
                </div>
              </div>

              {/* Task Selection Header */}
              <div className="flex items-center justify-between text-xs text-slate-600 px-0.5">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="flex items-center gap-1.5 font-medium hover:text-slate-900 cursor-pointer"
                >
                  {suggestions.every((s) => s.selected) ? (
                    <CheckSquare className="w-4 h-4 text-slate-900" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400" />
                  )}
                  Select All ({suggestions.length})
                </button>
                <span className="font-medium text-slate-500">
                  {selectedCount} of {suggestions.length} selected
                </span>
              </div>

              {/* Task Items List */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {suggestions.map((item) => (
                  <div
                    key={item.tempId}
                    className={`p-3 rounded-lg border transition-all ${
                      item.selected
                        ? 'bg-white border-slate-300 shadow-2xs'
                        : 'bg-slate-50/60 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleSelect(item.tempId)}
                        className="mt-0.5 text-slate-500 hover:text-slate-900 flex-shrink-0"
                      >
                        {item.selected ? (
                          <CheckSquare className="w-4 h-4 text-slate-900" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => handleUpdateTaskField(item.tempId, 'title', e.target.value)}
                          className="w-full text-xs font-semibold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-slate-900 focus:outline-none bg-transparent"
                        />

                        {item.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2.5 flex-wrap pt-1 text-xs">
                          {/* Priority dropdown */}
                          <select
                            value={item.priority}
                            onChange={(e) =>
                              handleUpdateTaskField(item.tempId, 'priority', e.target.value as TaskPriority)
                            }
                            className="text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-medium text-slate-700"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                          </select>

                          {/* Due Date */}
                          <div className="flex items-center gap-1 text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <input
                              type="date"
                              value={item.dueDate || ''}
                              onChange={(e) =>
                                handleUpdateTaskField(item.tempId, 'dueDate', e.target.value)
                              }
                              className="text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5"
                            />
                          </div>

                          {/* Assignee Dropdown */}
                          <div className="flex items-center gap-1 text-slate-500">
                            <UserIcon className="w-3.5 h-3.5" />
                            <select
                              value={item.suggestedAssigneeId || ''}
                              onChange={(e) =>
                                handleUpdateTaskField(item.tempId, 'suggestedAssigneeId', e.target.value)
                              }
                              className="text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 max-w-[140px] truncate"
                            >
                              <option value="">Unassigned</option>
                              {members.map((m) => (
                                <option key={m.userId} value={m.userId}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('prompt')}
                  className="gap-1.5 text-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Back / Re-plan
                </Button>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={creating || selectedCount === 0}
                    onClick={handleBatchCreate}
                    className="gap-1.5"
                  >
                    {creating ? (
                      'Adding Tasks...'
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Add {selectedCount} Tasks to Board
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
