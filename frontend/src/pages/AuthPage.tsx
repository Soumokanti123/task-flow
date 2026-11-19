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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50/50 via-white to-slate-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8">
        <div className="flex items-center justify-center gap-2 mb-6 text-indigo-600">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-200">
            <CheckSquare className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">TaskFlow</span>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isRegister
              ? 'Organize projects, assign tasks, and meet team deadlines'
              : 'Enter your credentials to access your projects'}
          </p>
        </div>

        {errors.general && (
          <div className="mb-4 p-3 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
                }`}
              />
              {errors.name && <span className="text-xs text-rose-600 mt-0.5 block">{errors.name}</span>}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
              }`}
            />
            {errors.email && <span className="text-xs text-rose-600 mt-0.5 block">{errors.email}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-300 focus:ring-indigo-200 focus:border-indigo-500'
              }`}
            />
            {errors.password && <span className="text-xs text-rose-600 mt-0.5 block">{errors.password}</span>}
          </div>

          <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
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

        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full text-indigo-700 border-indigo-200 hover:bg-indigo-50"
            onClick={handleDemoLogin}
            disabled={isLoading}
          >
            ⚡ Quick Demo Login (demo@taskflow.dev)
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrors({});
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Register now"}
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
