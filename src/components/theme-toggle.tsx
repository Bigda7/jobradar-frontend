import { Moon, Sun } from 'lucide-react';

import { useTheme } from '../theme-context';
import type { Theme } from '../theme-preference';

const themeOptions: Array<{
  value: Theme;
  label: string;
  icon: typeof Sun;
}> = [
  { value: 'light', label: 'Use light theme', icon: Sun },
  { value: 'dark', label: 'Use dark theme', icon: Moon },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="flex shrink-0 rounded-lg border border-white/[0.07] bg-white/[0.025] p-0.5"
    >
      {themeOptions.map(({ value, label, icon: Icon }) => {
        const isActive = theme === value;

        return (
          <button
            key={value}
            type="button"
            aria-label={label}
            aria-pressed={isActive}
            onClick={() => setTheme(value)}
            className={`grid h-7 w-7 place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-radar/70 ${
              isActive
                ? 'bg-white/[0.08] text-radar'
                : 'text-zinc-600 hover:bg-white/[0.04] hover:text-zinc-300'
            }`}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
