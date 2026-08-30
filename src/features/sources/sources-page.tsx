import { useQuery } from '@tanstack/react-query';
import { Activity, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';

import { getApiErrorMessage, getSources, queryKeys } from '../../api';
import { AppShell } from '../../components/app-shell';
import { serviceStatusUrl } from '../../service-status';
import { SourceCard } from './source-card';

export function SourcesPage() {
  const sourcesQuery = useQuery({
    queryKey: queryKeys.sources(),
    queryFn: ({ signal }) => getSources(signal),
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const sources = sourcesQuery.data ?? [];
  const enabledCount = sources.filter((source) => source.enabled).length;
  const errorCount = sources.filter((source) => source.last_error).length;

  return (
    <AppShell>
      <main className="flex min-h-[calc(100vh-64px)] min-w-0 flex-col bg-canvas lg:h-screen lg:min-h-0">
        <header className="shrink-0 border-b border-white/[0.06] bg-[#121314] px-4 py-5 sm:px-6 lg:px-7">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <span>Radar</span>
                <span>/</span>
                <span className="text-zinc-400">Monitoring</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
                <h1 className="text-xl font-semibold tracking-[-0.035em] text-white">
                  Sources
                </h1>
                {sourcesQuery.data ? (
                  <span className="text-xs text-zinc-600">
                    {sources.length} registered · {enabledCount} enabled ·{' '}
                    {errorCount} with reported errors
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
              <button
                type="button"
                onClick={() => sourcesQuery.refetch()}
                disabled={sourcesQuery.isFetching}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-xs text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200 disabled:cursor-wait"
              >
                <RefreshCw
                  className={`h-4 w-4 ${sourcesQuery.isFetching ? 'animate-spin text-radar' : ''}`}
                />
                Refresh
              </button>
              <a
                href={serviceStatusUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open JobRadar service status in a new tab"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 text-xs text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-radar/70 lg:hidden"
              >
                <Activity className="h-4 w-4 text-radar" />
                <span>Live status</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
          <p className="mt-3 max-w-3xl text-[11px] leading-5 text-zinc-700">
            Enabled state, timestamps, and the last reported error are shown
            independently. No runtime status is inferred.
          </p>
        </header>

        <div className="premium-scrollbar min-h-0 flex-1 overflow-y-auto">
          {sourcesQuery.isError ? (
            <div className="grid min-h-[420px] place-items-center p-6">
              <div className="max-w-md rounded-2xl border border-rose-400/15 bg-rose-400/[0.04] p-7 text-center">
                <AlertCircle className="mx-auto h-6 w-6 text-rose-300" />
                <h2 className="mt-4 text-base font-semibold text-zinc-100">
                  Unable to load sources
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {getApiErrorMessage(sourcesQuery.error, {
                    resource: 'Sources',
                  })}
                </p>
                <button
                  type="button"
                  onClick={() => sourcesQuery.refetch()}
                  className="mt-5 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm text-zinc-200 hover:bg-white/[0.07]"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : sourcesQuery.isPending ? (
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 2xl:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-72 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.025]"
                />
              ))}
            </div>
          ) : sources.length === 0 ? (
            <div className="grid min-h-[420px] place-items-center p-6 text-center">
              <div>
                <h2 className="text-base font-semibold text-zinc-200">
                  No registered sources
                </h2>
                <p className="mt-2 text-sm text-zinc-600">
                  The API returned an empty source list.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 2xl:grid-cols-3">
              {sources.map((source) => (
                <SourceCard key={source.id} source={source} />
              ))}
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
