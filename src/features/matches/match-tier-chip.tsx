import type { MatchTierFocus } from './match-view';

type MatchTierChipProps = {
  tier: MatchTierFocus;
  label: string;
  selected: boolean;
  onSelect: (tier: MatchTierFocus) => void;
};

export function MatchTierChip({
  tier,
  label,
  selected,
  onSelect,
}: MatchTierChipProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(tier)}
      aria-pressed={selected}
      className={`w-full rounded-full border px-3 py-1.5 text-[10px] font-medium transition-colors duration-200 ease-out sm:w-auto ${
        selected
          ? 'border-transparent bg-radar-selection text-radar-selection-ink'
          : 'border-white/[0.07] bg-white/[0.025] text-zinc-500 hover:text-zinc-200'
      }`}
    >
      {label}
    </button>
  );
}
