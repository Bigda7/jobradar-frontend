import { Star } from 'lucide-react';

import type { JobResponse, MatchResponse } from '../../api';
import { PremiumSelect } from '../../components/ui/premium-select';
import {
  trackerStore,
  useTrackerState,
} from './tracker-store';
import type { TrackerStatus } from './tracker-schema';
import {
  trackerStatusSelectOptions,
  trackerStatusSelectOptionsWithRemove,
} from './tracker-config';

type Opportunity = JobResponse | MatchResponse;

interface TrackerStatusControlProps {
  opportunity: Opportunity;
  compact?: boolean;
}

export function TrackerStatusControl({
  opportunity,
  compact = false,
}: TrackerStatusControlProps) {
  const trackerState = useTrackerState();
  const record = trackerState.records[String(opportunity.id)];

  if (!record) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          trackerStore.saveOpportunity(opportunity);
        }}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.035] text-zinc-400 transition-colors hover:border-radar/30 hover:bg-radar/[0.07] hover:text-radar ${
          compact ? 'h-8 px-2.5 text-[11px]' : 'h-10 px-3 text-xs'
        }`}
        aria-label={`Save ${opportunity.title} to tracker`}
      >
        <Star className="h-3.5 w-3.5" />
        Save
      </button>
    );
  }

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <PremiumSelect
        value={record.status}
        onValueChange={(status) => {
          if (status === 'remove') {
            trackerStore.removeOpportunity(opportunity.id);
          } else {
            trackerStore.setStatus(opportunity.id, status as TrackerStatus);
          }
        }}
        options={trackerStatusSelectOptionsWithRemove}
        label={`Tracker status for ${opportunity.title}`}
        leadingIcon={<Star className="h-3.5 w-3.5 fill-radar text-radar" />}
        triggerClassName={compact ? 'h-8 px-2.5 text-[11px]' : ''}
      />
    </div>
  );
}
