import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

export function LoginPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;
    setLoading(true);
    try {
      await login(email, password, role);
      navigate(role === 'hr' ? '/hr' : '/apply');
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-slate-100">HireForce</h1>
          <p className="mt-2 text-slate-400">How would you like to sign in?</p>
        </div>

        <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setRole('hr')}
            className="group flex flex-col items-center rounded-2xl border border-slate-700 bg-slate-900/60 p-8 transition hover:border-indigo-500/50 hover:bg-indigo-500/10"
          >
            <div className="mb-4 rounded-2xl bg-indigo-500/20 p-4 transition group-hover:bg-indigo-500/30">
              <Users className="h-8 w-8 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">HR / Recruiter</h2>
            <p className="mt-2 text-center text-sm text-slate-500">
              Manage pipeline, interviews, and onboarding
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRole('applicant')}
            className="group flex flex-col items-center rounded-2xl border border-slate-700 bg-slate-900/60 p-8 transition hover:border-violet-500/50 hover:bg-violet-500/10"
          >
            <div className="mb-4 rounded-2xl bg-violet-500/20 p-4 transition group-hover:bg-violet-500/30">
              <Briefcase className="h-8 w-8 text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold text-slate-100">Applicant</h2>
            <p className="mt-2 text-center text-sm text-slate-500">
              Apply to roles and track your application
            </p>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
        <button
          type="button"
          onClick={() => setRole(null)}
          className="mb-6 text-sm text-slate-500 hover:text-slate-300"
        >
          ← Change role
        </button>

        <h1 className="text-2xl font-bold text-slate-100">
          Sign in as {role === 'hr' ? 'HR' : 'Applicant'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Demo: any email & password works</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-400">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-400">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
