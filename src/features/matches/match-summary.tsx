import { MatchTierChip } from './match-tier-chip';
import { getLoadedMatchMetrics, type MatchTierFocus } from './match-view';

const tierChips: { value: MatchTierFocus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'top', label: 'Top 85+' },
  { value: 'strong', label: 'Strong 70–84' },
  { value: 'good', label: 'Good 55–69' },
];

type MatchSummaryProps = {
  metrics: ReturnType<typeof getLoadedMatchMetrics>;
  trackedCount: number;
  tierFocus: MatchTierFocus;
  onSelectTier: (tier: MatchTierFocus) => void;
};

export function MatchSummary({
  metrics,
  trackedCount,
  tierFocus,
  onSelectTier,
}: MatchSummaryProps) {
  return (
    <section
      aria-label="Loaded results summary"
      className="@container/match-summary border-t border-white/[0.04]"
    >
      <div className="grid gap-4 px-4 py-3 sm:px-6 lg:px-7 @min-[62rem]/match-summary:grid-cols-[minmax(0,1fr)_28rem] @min-[62rem]/match-summary:items-center">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-700">
            Loaded results
          </span>
          <div
            role="group"
            aria-label="Match groups"
            className="grid grid-cols-2 gap-1.5 @min-[32rem]/match-summary:flex @min-[32rem]/match-summary:flex-wrap"
          >
            {tierChips.map((chip) => (
              <MatchTierChip
                key={chip.value}
                tier={chip.value}
                label={chip.label}
                selected={tierFocus === chip.value}
                onSelect={onSelectTier}
              />
            ))}
          </div>
        </div>
        <dl className="grid min-w-0 grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.05] @min-[32rem]/match-summary:grid-cols-4">
          {[
            ['Top score', metrics.topScore ?? '—'],
            ['Remote', `${metrics.remotePercentage}%`],
            ['Salary shown', `${metrics.salaryDisclosedPercentage}%`],
            ['Tracked', trackedCount],
          ].map(([label, value]) => (
            <div key={label} className="flex min-w-0 flex-col gap-1 bg-panel px-3 py-2.5">
              <dt className="whitespace-nowrap text-[9px] uppercase tracking-[0.09em] text-zinc-700">
                {label}
              </dt>
              <dd className="text-xs font-semibold tabular-nums text-zinc-300">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
