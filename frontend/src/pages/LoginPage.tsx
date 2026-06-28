import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';
import { CubeWireframe } from '../components/hero/CubeWireframe';

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
      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute inset-0 hero-grid" />

        <header className="relative z-10 flex items-center justify-between px-6 py-5">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-white/70">
            HireForce
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30">
            recruiting_os
          </span>
        </header>

        <main className="relative z-10 mx-auto flex min-h-[calc(100vh-72px)] max-w-5xl flex-col items-center justify-center px-6 text-center">
          <div className="relative mb-10 flex items-center justify-center">
            <div
              className="pointer-events-none absolute h-56 w-56 rounded-full sm:h-72 sm:w-72"
              style={{
                background:
                  'radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%)',
              }}
            />
            <CubeWireframe className="h-56 w-56 sm:h-72 sm:w-72 lg:h-80 lg:w-80" />
          </div>

          <h1 className="font-mono text-4xl font-semibold tracking-tight sm:text-6xl">
            HireForce
          </h1>
          <p className="mt-4 max-w-xl text-sm text-white/60 sm:text-base">
            Candidate pipelines, interviews, and onboarding &mdash; engineered into
            one clean, high-contrast workspace.
          </p>
          <p className="mt-6 font-mono text-xs uppercase tracking-[0.3em] text-white/40">
            $ select access level
          </p>

          <div className="mt-6 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => setRole('hr')}
              className="btn-mono btn-mono-solid w-full sm:w-auto"
            >
              HR Login
            </button>
            <button
              type="button"
              onClick={() => setRole('applicant')}
              className="btn-mono btn-mono-outline w-full sm:w-auto"
            >
              Job Applicant Login
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="pointer-events-none absolute inset-0 hero-grid" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-xl border border-white/20 bg-black/80 p-8 backdrop-blur">
          <button
            type="button"
            onClick={() => setRole(null)}
            className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-white/50 transition-colors hover:text-white"
          >
            ← change role
          </button>

          <h1 className="text-2xl font-semibold text-white">
            Sign in as {role === 'hr' ? 'HR' : 'Job Applicant'}
          </h1>
          <p className="mt-1 text-sm text-white/50">Enter any email and password to continue.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium uppercase tracking-wider text-white/60"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-1 w-full rounded-md border border-white/20 bg-black px-4 py-2.5 text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-wider text-white/60"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-md border border-white/20 bg-black px-4 py-2.5 text-white placeholder:text-white/30 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-mono btn-mono-solid w-full"
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
    </div>
  );
}
