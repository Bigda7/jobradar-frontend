import { useQuery } from '@tanstack/react-query';
import { Database, LoaderCircle } from 'lucide-react';

import { getReadiness, queryKeys } from '../api';

export function ApiReadyIndicator() {
  const readiness = useQuery({
    queryKey: queryKeys.readiness(),
    queryFn: ({ signal }) => getReadiness(signal),
    refetchInterval: 30_000,
    retry: false,
  });

  const isReady = readiness.data?.status === 'ready';
  const label = readiness.isFetching
    ? 'Checking API'
    : isReady
      ? 'API Ready'
      : 'API unavailable';

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-3">
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-white/[0.04]">
        {readiness.isFetching ? (
          <LoaderCircle className="h-4 w-4 animate-spin text-radar" />
        ) : (
          <Database
            className={`h-4 w-4 ${isReady ? 'text-radar' : 'text-rose-400'}`}
          />
        )}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium text-zinc-200">{label}</span>
        <span className="mt-0.5 block text-[11px] text-zinc-600">
          FastAPI and PostgreSQL
        </span>
      </span>
    </div>
  );
}
