import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Video,
  ClipboardList,
  LogOut,
  Users,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/hr', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/hr/jobs', label: 'Job Openings', icon: Briefcase },
  { to: '/hr/interviews', label: 'Interviews', icon: Video },
  { to: '/hr/onboarding', label: 'Onboarding', icon: ClipboardList },
];

export function HRLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-black text-white">
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/15 bg-black">
        <div className="border-b border-white/15 p-6">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-white" />
            <span className="font-mono text-lg font-bold tracking-tight text-white">Worknite</span>
          </div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.3em] text-white/40">
            HR Portal
          </p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-black'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/15 p-4">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-white/40">{user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white hover:text-black"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
