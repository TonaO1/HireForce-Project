import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FileText, Calendar, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/apply', label: 'Browse Jobs', icon: FileText, end: true },
  { to: '/my-application', label: 'My Application', icon: User },
  { to: '/book-interview', label: 'Book Interview', icon: Calendar },
];

export function ApplicantLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/15 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-mono text-lg font-bold tracking-tight text-white">Worknite</span>
          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
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
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Sign out"
              className="ml-2 flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white hover:text-black"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
