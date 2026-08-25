import type { TrackerStatus } from './tracker-schema';

interface TrackerStatusMeta {
  label: string;
  description: string;
  markerClassName: string;
}

export const trackerStatusMeta: Record<TrackerStatus, TrackerStatusMeta> = {
  saved: {
    label: 'Saved',
    description: 'Worth a closer look',
    markerClassName: 'bg-violet-300',
  },
  applied: {
    label: 'Applied',
    description: 'Application submitted',
    markerClassName: 'bg-cyan-300',
  },
  interview: {
    label: 'Interview',
    description: 'Conversation in progress',
    markerClassName: 'bg-amber-300',
  },
  offer: {
    label: 'Offer',
    description: 'Offer received',
    markerClassName: 'bg-radar',
  },
  archived: {
    label: 'Archived',
    description: 'Removed from active pipeline',
    markerClassName: 'bg-zinc-500',
  },
};

export const trackerStatusSelectOptions = Object.entries(trackerStatusMeta).map(
  ([value, meta]) => ({ value, label: meta.label }),
);

export const trackerStatusSelectOptionsWithRemove = [
  ...trackerStatusSelectOptions,
  { value: 'remove', label: 'Remove from tracker' },
];
