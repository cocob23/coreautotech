import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '../../utils/cn'
import type { FC } from 'react'

export const Tabs = TabsPrimitive.Root
export const TabsList: FC<TabsPrimitive.TabsListProps> = ({ className, ...props }) => (
  <TabsPrimitive.List className={cn('inline-flex h-10 items-center justify-center rounded-md bg-neutral-900 p-1 text-neutral-400', className)} {...props} />
)
export const TabsTrigger: FC<TabsPrimitive.TabsTriggerProps> = ({ className, ...props }) => (
  <TabsPrimitive.Trigger className={cn('inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-brand data-[state=active]:text-brand-foreground', className)} {...props} />
)
export const TabsContent: FC<TabsPrimitive.TabsContentProps> = ({ className, ...props }) => (
  <TabsPrimitive.Content className={cn('mt-4', className)} {...props} />
)
