import { useEffect, useState, type ReactNode } from 'react';
import {
  BriefcaseBusiness,
  ClipboardList,
  RadioTower,
  Radar,
  Search,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { ApiReadyIndicator } from './api-ready-indicator';
import { CommandPalette } from './command-palette';
import {
  getActiveTrackerCount,
  startTrackerStorageSync,
  useTrackerState,
} from '../features/tracker/tracker-store';

interface AppShellProps {
  children: ReactNode;
  matchCount?: number;
}

const navigation = [
  { to: '/matches', label: 'Matches', icon: Radar },
  { to: '/jobs', label: 'All jobs', icon: Search },
  { to: '/tracker', label: 'Tracker', icon: ClipboardList },
  { to: '/sources', label: 'Sources', icon: RadioTower },
];

export function AppShell({ children, matchCount }: AppShellProps) {
  const trackerState = useTrackerState();
  const trackedCount = getActiveTrackerCount(trackerState);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const openCommandPalette = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
    };

    window.addEventListener('keydown', openCommandPalette);
    return () => window.removeEventListener('keydown', openCommandPalette);
  }, []);

  useEffect(() => startTrackerStorageSync(), []);

  return (
    <div className="min-h-screen bg-canvas text-zinc-100 lg:grid lg:h-screen lg:grid-cols-[248px_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="hidden border-r border-white/[0.06] bg-[#121314] lg:flex lg:min-h-0 lg:flex-col">
        <div className="flex h-[76px] items-center gap-3 border-b border-white/[0.06] px-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-radar text-[#11130e] shadow-[0_0_24px_rgb(163_230_53/14%)]">
            <Radar className="h-5 w-5" strokeWidth={2.4} />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight">
              JobRadar
            </span>
            <span className="block text-[11px] text-zinc-600">
              Opportunity intelligence
            </span>
          </span>
        </div>

        <div className="px-3 pt-4">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex w-full items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-xs text-zinc-600 hover:bg-white/[0.045] hover:text-zinc-300"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Quick search</span>
            <kbd className="ml-auto rounded border border-white/[0.07] px-1.5 py-0.5 text-[9px] text-zinc-700">
              ⌘ K
            </kbd>
          </button>
        </div>

        <nav
          className="premium-scrollbar flex-1 overflow-y-auto px-3 py-6"
          aria-label="Primary navigation"
        >
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-700">
            Workspace
          </p>
          <div className="space-y-1">
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-white/[0.065] text-white'
                      : 'text-zinc-500 hover:bg-white/[0.035] hover:text-zinc-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`h-[17px] w-[17px] ${isActive ? 'text-radar' : 'text-zinc-600 group-hover:text-zinc-400'}`}
                    />
                    <span>{label}</span>
                    {to === '/matches' && matchCount !== undefined ? (
                      <span className="ml-auto rounded-full bg-radar px-2 py-0.5 text-[10px] font-bold text-[#11130e]">
                        {matchCount}
                      </span>
                    ) : to === '/tracker' && trackedCount > 0 ? (
                      <span className="ml-auto rounded-full bg-white/[0.08] px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                        {trackedCount}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <ApiReadyIndicator />
          <div className="mt-3 flex items-center gap-2 px-2 text-[11px] text-zinc-700">
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            <span>Backend read-only · Tracker local</span>
          </div>
        </div>
      </aside>

      <div className="min-w-0 lg:min-h-0 lg:overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#121314] px-4 lg:hidden">
          <NavLink to="/matches" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-radar text-[#11130e]">
              <Radar className="h-4 w-4" />
            </span>
            <span className="hidden text-sm font-semibold sm:inline">
              JobRadar
            </span>
          </NavLink>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              aria-label="Open command palette"
              className="grid h-9 w-9 place-items-center rounded-lg text-zinc-600"
            >
              <Search className="h-[17px] w-[17px]" />
            </button>
            <nav
              className="flex items-center gap-1"
              aria-label="Mobile navigation"
            >
              {navigation.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  aria-label={label}
                  className={({ isActive }) =>
                    `grid h-9 w-9 place-items-center rounded-lg ${
                      isActive ? 'bg-white/[0.07] text-radar' : 'text-zinc-600'
                    }`
                  }
                >
                  <Icon className="h-[17px] w-[17px]" />
                </NavLink>
              ))}
            </nav>
          </div>
        </header>
        {children}
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
