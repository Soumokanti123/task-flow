import React, { useState } from 'react';
import { ProjectMember } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { User, UserPlus, Shield } from 'lucide-react';

interface MembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: ProjectMember[];
  onAddMember: (email: string) => Promise<void>;
}

export const MembersModal: React.FC<MembersModalProps> = ({
  isOpen,
  onClose,
  members,
  onAddMember,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter a user email');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');
    try {
      await onAddMember(email.trim());
      setSuccess(`Added ${email.trim()} to project`);
      setEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add member to project');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Project Members">
      <div className="space-y-4">
        {/* Add Member Form */}
        <form onSubmit={handleAdd} className="space-y-2 pb-4 border-b border-slate-100">
          <label className="block text-xs font-semibold text-slate-700">
            Add Team Member by Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
                setSuccess('');
              }}
              placeholder="e.g. alex@taskflow.dev"
              className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400"
            />
            <Button type="submit" size="sm" isLoading={isLoading}>
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              Add
            </Button>
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-medium">{error}</p>
          )}
          {success && (
            <p className="text-xs text-emerald-600 font-medium">{success}</p>
          )}
        </form>

        {/* Members List */}
        <div>
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Registered Members ({members.length})
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50/50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900 leading-tight">
                      {member.name}
                    </div>
                    <div className="text-xs text-slate-500">{member.email}</div>
                  </div>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded border font-medium ${
                    member.role === 'OWNER'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {member.role === 'OWNER' && <Shield className="w-3 h-3" />}
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
