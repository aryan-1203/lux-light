/**
 * Dawnlit design system — import from '@/design-system'.
 * Inventory + usage: docs/DESIGN_SYSTEM.md.
 */
export { cn } from './cn';
export * from './format';
export * from './motion';
export {
  colors,
  cssVar,
  kelvinTint,
  durations as durationMs,
  easings,
  springs,
  type ColorToken,
} from './tokens';

export { useMediaQuery, useIsTouch } from './hooks/useMediaQuery';
export { useToast, useApiErrorToast } from './hooks/useToast';
export { useLenis, useLenisLock } from './hooks/useLenis';
export { useFieldA11y } from './hooks/useFieldA11y';

export { Accordion, type AccordionItemData, type AccordionProps } from './components/Accordion';
export { AnimatedCounter, type AnimatedCounterProps } from './components/AnimatedCounter';
export { Badge, type BadgeProps, type BadgeTone } from './components/Badge';
export { Button, type ButtonProps } from './components/Button';
export { buttonVariants, type ButtonSize, type ButtonVariant } from './components/buttonStyles';
export { Card, type CardProps } from './components/Card';
export { Checkbox, type CheckboxProps } from './components/Checkbox';
export { Container, type ContainerProps } from './components/Container';
export { CursorSpotlight, type CursorSpotlightProps } from './components/CursorSpotlight';
export { Dialog, type DialogProps } from './components/Dialog';
export { Drawer, type DrawerProps } from './components/Drawer';
export { EmptyState, type EmptyStateProps } from './components/EmptyState';
export { controlClasses, FieldLabel, FieldMessages, type FieldBaseProps } from './components/Field';
export { GrainOverlay, type GrainOverlayProps } from './components/GrainOverlay';
export { Icon, type IconProps, type IconSize } from './components/Icon';
export { Input, type InputProps } from './components/Input';
export { Logo, LogoMark } from './components/Logo';
export { MagneticButton, type MagneticButtonProps } from './components/MagneticButton';
export { Marquee, type MarqueeProps } from './components/Marquee';
export { PageStub } from './components/PageStub';
export { Price, type PriceProps } from './components/Price';
export { Radio, RadioGroup, type RadioGroupProps, type RadioProps } from './components/Radio';
export { Rating, RatingInput, type RatingInputProps, type RatingProps } from './components/Rating';
export { Section, type SectionProps } from './components/Section';
export { Select, type SelectOption, type SelectProps } from './components/Select';
export { Skeleton, type SkeletonProps } from './components/Skeleton';
export {
  SmoothScrollProvider,
  type SmoothScrollProviderProps,
} from './components/SmoothScrollProvider';
export { Spinner, type SpinnerProps } from './components/Spinner';
export { StaggerText, type StaggerTextProps } from './components/StaggerText';
export { Switch, type SwitchProps } from './components/Switch';
export { Tabs, type TabItem, type TabsProps } from './components/Tabs';
export { Textarea, type TextareaProps } from './components/Textarea';
export { ToastRegion } from './components/ToastRegion';
export {
  Heading,
  Text,
  type HeadingProps,
  type HeadingSize,
  type TextProps,
} from './components/Typography';
export { VisuallyHidden, type VisuallyHiddenProps } from './components/VisuallyHidden';
export * from './illustrations';
