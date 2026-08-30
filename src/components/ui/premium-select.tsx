import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

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
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenu.Trigger
        aria-label={label}
        disabled={disabled}
        className={`inline-flex h-10 items-center justify-between gap-2 whitespace-nowrap rounded-xl border border-white/[0.08] bg-[#1a1b1d] px-3 text-xs text-zinc-300 outline-none transition-colors hover:border-white/[0.14] focus:border-radar/45 focus:ring-2 focus:ring-radar/10 disabled:cursor-not-allowed disabled:opacity-50 ${triggerClassName}`}
      >
        <span className="flex min-w-0 items-center gap-2 whitespace-nowrap">
          {leadingIcon}
          <span className="truncate">{selectedLabel}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          collisionPadding={8}
          className="z-[100] max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto rounded-xl border border-white/[0.09] bg-[#202124] p-1 shadow-2xl shadow-black/40"
        >
          <DropdownMenu.RadioGroup value={value} onValueChange={onValueChange}>
            {options.map((option) => (
              <DropdownMenu.RadioItem
                key={option.value}
                value={option.value}
                className="relative flex cursor-default select-none items-center rounded-lg py-2 pl-8 pr-3 text-xs text-zinc-400 outline-none data-[highlighted]:bg-white/[0.07] data-[highlighted]:text-white"
              >
                <DropdownMenu.ItemIndicator className="absolute left-2.5 text-radar">
                  <Check className="h-3.5 w-3.5" />
                </DropdownMenu.ItemIndicator>
                {option.label}
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
