import * as RadixAccordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../cn';
import { Icon } from './Icon';

export type AccordionItemData = { id: string; title: ReactNode; content: ReactNode };

export type AccordionProps = {
  items: AccordionItemData[];
  /** 'single' (default) closes others when one opens. */
  type?: 'single' | 'multiple';
  defaultValue?: string[];
  /** Heading level wrapping each trigger (WAI-ARIA accordion pattern). */
  headingLevel?: 2 | 3 | 4;
  className?: string;
};

/**
 * Accessible accordion (Radix): buttons inside headings, aria-expanded/controls, arrow-key
 * navigation, Home/End. Content fades (opacity only — no height animation → no layout thrash).
 */
export function Accordion({
  items,
  type = 'single',
  defaultValue,
  headingLevel = 3,
  className,
}: AccordionProps) {
  const H = `h${headingLevel}` as const;
  const rootProps =
    type === 'single'
      ? ({ type: 'single', collapsible: true, defaultValue: defaultValue?.[0] } as const)
      : ({ type: 'multiple', defaultValue } as const);
  return (
    <RadixAccordion.Root
      {...rootProps}
      className={cn('divide-y divide-border border-y border-border', className)}
    >
      {items.map((item) => (
        <RadixAccordion.Item key={item.id} value={item.id}>
          <RadixAccordion.Header asChild>
            <H className="m-0">
              <RadixAccordion.Trigger className="group flex min-h-touch w-full items-center justify-between gap-4 py-5 text-left font-display text-lg font-medium text-fg transition-colors duration-fast hover:text-sunrise-strong">
                <span>{item.title}</span>
                <Icon
                  icon={ChevronDown}
                  className="text-muted transition-transform duration-ui ease-out group-data-[state=open]:rotate-180 group-data-[state=open]:text-sunrise-strong"
                />
              </RadixAccordion.Trigger>
            </H>
          </RadixAccordion.Header>
          <RadixAccordion.Content className="pb-6 pr-8 text-base text-muted data-[state=open]:animate-fade-in">
            {item.content}
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  );
}
