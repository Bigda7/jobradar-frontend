import * as Dialog from '@radix-ui/react-dialog';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Command } from 'cmdk';
import {
  BriefcaseBusiness,
  ClipboardList,
  LoaderCircle,
  RadioTower,
  Radar,
  Search,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  getApiErrorMessage,
  getJobs,
  type MatchListResponse,
  type MatchResponse,
} from '../api';
import { useDebouncedValue } from '../hooks/use-debounced-value';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigationItems = [
  { label: 'Matches', route: '/matches', icon: Radar },
  { label: 'All jobs', route: '/jobs', icon: BriefcaseBusiness },
  { label: 'Tracker', route: '/tracker', icon: ClipboardList },
  { label: 'Sources', route: '/sources', icon: RadioTower },
];

export function CommandPalette({
  open,
  onOpenChange,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim().slice(0, 100), 350);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const normalizedSearch = search.trim().toLocaleLowerCase();

  const cachedQueries = queryClient.getQueriesData<MatchListResponse>({
    queryKey: ['matches'],
  });
  const deduplicatedMatches = new Map<number, MatchResponse>();

  for (const [, data] of cachedQueries) {
    for (const match of data?.items ?? []) {
      deduplicatedMatches.set(match.id, match);
    }
  }

  const loadedMatches = [...deduplicatedMatches.values()];

  const matchingLoadedMatches = loadedMatches
    .filter((match) => {
      if (!normalizedSearch) {
        return true;
      }

      return [match.title, match.company, match.description]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalizedSearch));
    })
    .slice(0, 6);

  const remoteJobsQuery = useQuery({
    queryKey: ['command-palette', 'remote-jobs', debouncedSearch],
    queryFn: ({ signal }) =>
      getJobs(
        {
          q: debouncedSearch,
          work_mode: 'remote',
          limit: 6,
          offset: 0,
        },
        signal,
      ),
    enabled: open && debouncedSearch.length >= 2,
    staleTime: 30_000,
  });

  const selectRoute = (route: string) => {
    onOpenChange(false);
    setSearch('');
    navigate(route);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      setSearch('');
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[110] bg-black/65 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content className="fixed left-1/2 top-[14vh] z-[120] w-[min(640px,calc(100%-24px))] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#191a1c] shadow-[0_28px_100px_rgb(0_0_0/60%)] outline-none">
          <Dialog.Title className="sr-only">JobRadar command palette</Dialog.Title>
          <Command shouldFilter={false} className="bg-transparent text-zinc-100">
            <div className="flex h-14 items-center gap-3 border-b border-white/[0.07] px-4">
              <Search className="h-4 w-4 shrink-0 text-zinc-600" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Navigate or search remote jobs"
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-700"
              />
              <kbd className="hidden rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-[10px] text-zinc-600 sm:inline">
                Esc
              </kbd>
              <Dialog.Close
                aria-label="Close search"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-zinc-500 transition-colors hover:bg-white/[0.07] hover:text-white sm:hidden"
              >
                <X className="h-4 w-4" />
              </Dialog.Close>
            </div>

            <Command.List className="premium-scrollbar max-h-[min(64vh,560px)] overflow-y-auto p-2">
              {!normalizedSearch ? (
                <Command.Group
                  heading="Navigation"
                  className="px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700"
                >
                  {navigationItems.map(({ label, route, icon: Icon }) => (
                    <Command.Item
                      key={route}
                      value={`navigation-${route}`}
                      onSelect={() => selectRoute(route)}
                      className="mt-1 flex cursor-default items-center gap-3 rounded-xl px-3 py-3 text-sm font-normal normal-case tracking-normal text-zinc-400 outline-none data-[selected=true]:bg-white/[0.07] data-[selected=true]:text-white"
                    >
                      <Icon className="h-4 w-4 text-zinc-600" />
                      {label}
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}

              {matchingLoadedMatches.length > 0 ? (
                <Command.Group
                  heading="Loaded matches"
                  className="px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700"
                >
                  {matchingLoadedMatches.map((match) => (
                    <Command.Item
                      key={match.id}
                      value={`match-${match.id}`}
                      onSelect={() =>
                        selectRoute(`/matches?opportunity=${match.id}`)
                      }
                      className="mt-1 flex cursor-default items-center gap-3 rounded-xl px-3 py-3 font-normal normal-case tracking-normal outline-none data-[selected=true]:bg-white/[0.07]"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-radar text-xs font-bold text-[#15170f]">
                        {match.score}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-zinc-200">
                          {match.title}
                        </span>
                        <span className="mt-0.5 block truncate text-[11px] text-zinc-600">
                          {match.company ?? 'Company not specified'}
                        </span>
                      </span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}

              {normalizedSearch ? (
                <Command.Group
                  heading="Search remote jobs"
                  className="px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700"
                >
                  {debouncedSearch.length < 2 ? (
                    <div className="px-3 py-4 text-xs font-normal normal-case tracking-normal text-zinc-600">
                      Enter at least 2 characters.
                    </div>
                  ) : remoteJobsQuery.isFetching ? (
                    <div className="flex items-center gap-2 px-3 py-4 text-xs font-normal normal-case tracking-normal text-zinc-600">
                      <LoaderCircle className="h-4 w-4 animate-spin text-radar" />
                      Searching remote jobs
                    </div>
                  ) : remoteJobsQuery.isError ? (
                    <div className="px-3 py-4 text-xs font-normal normal-case tracking-normal text-rose-300">
                      <p>
                        {getApiErrorMessage(remoteJobsQuery.error, {
                          resource: 'Remote jobs',
                          validationMessage:
                            'The remote job search was rejected by the API.',
                        })}
                      </p>
                      <button
                        type="button"
                        onClick={() => remoteJobsQuery.refetch()}
                        className="mt-3 rounded-lg border border-white/[0.08] px-3 py-1.5 text-zinc-300 hover:bg-white/[0.05]"
                      >
                        Try again
                      </button>
                    </div>
                  ) : remoteJobsQuery.data?.items.length ? (
                    remoteJobsQuery.data.items.map((job) => (
                      <Command.Item
                        key={job.id}
                        value={`remote-job-${job.id}`}
                        onSelect={() =>
                          selectRoute(
                            `/jobs?q=${encodeURIComponent(search.trim())}`,
                          )
                        }
                        className="mt-1 flex cursor-default items-center gap-3 rounded-xl px-3 py-3 font-normal normal-case tracking-normal outline-none data-[selected=true]:bg-white/[0.07]"
                      >
                        <BriefcaseBusiness className="h-4 w-4 shrink-0 text-zinc-600" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm text-zinc-200">
                            {job.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-zinc-600">
                            {job.company ?? 'Company not specified'} · Remote
                          </span>
                        </span>
                      </Command.Item>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-xs font-normal normal-case tracking-normal text-zinc-600">
                      No remote jobs found.
                    </div>
                  )}
                </Command.Group>
              ) : null}
            </Command.List>

            <div className="hidden items-center justify-between border-t border-white/[0.07] px-4 py-2.5 text-[10px] text-zinc-700 sm:flex">
              <span>Arrow keys to navigate · Enter to open</span>
              <span>Remote API search uses /jobs</span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
