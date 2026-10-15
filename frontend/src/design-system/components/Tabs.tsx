import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import { cn } from '../cn';

export type TabItem = { id: string; label: ReactNode; content: ReactNode; disabled?: boolean };

export type TabsProps = {
  items: TabItem[];
  /** Accessible name for the tab list. */
  label: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  listClassName?: string;
};

/** WAI-ARIA tabs (Radix): roving tabindex, arrow keys, automatic activation. */
export function Tabs({
  items,
  label,
  defaultValue,
  value,
  onValueChange,
  className,
  listClassName,
}: TabsProps) {
  return (
    <RadixTabs.Root
      className={className}
      defaultValue={defaultValue ?? items[0]?.id}
      value={value}
      onValueChange={onValueChange}
    >
      <RadixTabs.List
        aria-label={label}
        className={cn(
          'scrollbar-thin flex gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1',
          listClassName,
        )}
      >
        {items.map((tab) => (
          <RadixTabs.Trigger
            key={tab.id}
            value={tab.id}
            disabled={tab.disabled}
            className="min-h-touch shrink-0 rounded-full px-5 font-display text-sm font-medium text-muted transition-colors duration-fast hover:text-fg disabled:opacity-45 data-[state=active]:bg-surface-3 data-[state=active]:text-fg"
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((tab) => (
        <RadixTabs.Content key={tab.id} value={tab.id} className="pt-6">
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
