import * as Select from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface PremiumSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  label: string;
  leadingIcon?: ReactNode;
  triggerClassName?: string;
  disabled?: boolean;
}

export function PremiumSelect({
  value,
  onValueChange,
  options,
  label,
  leadingIcon,
  triggerClassName = '',
  disabled = false,
}: PremiumSelectProps) {
  return (
    <Select.Root
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <Select.Trigger
        aria-label={label}
        className={`inline-flex h-10 items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-[#1a1b1d] px-3 text-xs text-zinc-300 outline-none transition-colors hover:border-white/[0.14] focus:border-radar/45 focus:ring-2 focus:ring-radar/10 disabled:cursor-not-allowed disabled:opacity-50 ${triggerClassName}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {leadingIcon}
          <Select.Value />
        </span>
        <Select.Icon>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-600" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="z-[100] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-white/[0.09] bg-[#202124] p-1 shadow-2xl shadow-black/40"
        >
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="relative flex cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 text-xs text-zinc-400 outline-none data-[highlighted]:bg-white/[0.07] data-[highlighted]:text-white"
              >
                <Select.ItemIndicator className="absolute left-2.5 text-radar">
                  <Check className="h-3.5 w-3.5" />
                </Select.ItemIndicator>
                <Select.ItemText>{option.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
