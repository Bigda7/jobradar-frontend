import { PremiumSelect } from '../../components/ui/premium-select';
import { trackerStatusSelectOptionsWithRemove } from './tracker-config';
import type { TrackerRecord, TrackerStatus } from './tracker-schema';
import { trackerStore } from './tracker-store';

interface TrackerRecordStatusSelectProps {
  record: TrackerRecord;
  compact?: boolean;
}

export function TrackerRecordStatusSelect({
  record,
  compact = false,
}: TrackerRecordStatusSelectProps) {
  return (
    <PremiumSelect
      value={record.status}
      onValueChange={(status) => {
        if (status === 'remove') {
          trackerStore.removeOpportunity(record.opportunityId);
        } else {
          trackerStore.setStatus(
            record.opportunityId,
            status as TrackerStatus,
          );
        }
      }}
      options={trackerStatusSelectOptionsWithRemove}
      label={`Tracker status for ${record.snapshot.title}`}
      triggerClassName={compact ? 'h-8 px-2.5 text-[11px]' : 'min-w-36'}
    />
  );
}
