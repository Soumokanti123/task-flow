import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';
import { Button } from '../components/common/Button';
import { CheckSquare, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setErrors({ name: 'Name is required' });
          setIsLoading(false);
          return;
        }
        const data = await authApi.register({ name: name.trim(), email: email.trim(), password });
        login(data.token, data.user);
      } else {
        const data = await authApi.login({ email: email.trim(), password });
        login(data.token, data.user);
      }
    } catch (err: any) {
      if (err.response?.data?.fieldErrors) {
        setErrors(err.response.data.fieldErrors);
      } else if (err.response?.data?.message) {
        setErrors({ general: err.response.data.message });
      } else {
        setErrors({ general: 'Authentication failed. Please check your credentials.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrors({});
    setIsLoading(true);
    try {
      const data = await authApi.login({ email: 'demo@taskflow.dev', password: 'Password123!' });
      login(data.token, data.user);
    } catch (err: any) {
      setErrors({ general: 'Failed to log in as demo user. Ensure the backend is running.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-center gap-2 mb-4 text-slate-800">
          <CheckSquare className="w-5 h-5 text-slate-800" />
          <span className="text-xl font-bold tracking-tight">TaskFlow</span>
        </div>

        <div className="text-center mb-5">
          <h2 className="text-base font-semibold text-slate-900">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isRegister
              ? 'Enter your details to get started'
              : 'Enter your credentials to access your projects'}
          </p>
        </div>

        {errors.general && (
          <div className="mb-4 p-2.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className={`w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 ${
                  errors.name
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-slate-400 focus:border-slate-400'
                }`}
              />
              {errors.name && <span className="text-xs text-rose-600 mt-0.5 block">{errors.name}</span>}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@taskflow.dev"
              className={`w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 ${
                errors.email
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-slate-400 focus:border-slate-400'
              }`}
            />
            {errors.email && <span className="text-xs text-rose-600 mt-0.5 block">{errors.email}</span>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-3 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 ${
                errors.password
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-slate-400 focus:border-slate-400'
              }`}
            />
            {errors.password && <span className="text-xs text-rose-600 mt-0.5 block">{errors.password}</span>}
          </div>

          <Button type="submit" className="w-full mt-1" isLoading={isLoading}>
            {isRegister ? (
              <span className="flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" /> Create Account
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <LogIn className="w-4 h-4" /> Sign In
              </span>
            )}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2.5">
          <Button
            type="button"
            variant="outline"
            className="w-full text-slate-700 border-slate-300 hover:bg-slate-50"
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            Sign in as Demo User
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrors({});
              }}
              className="text-xs text-slate-600 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Register"}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
