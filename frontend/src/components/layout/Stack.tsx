import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Stack Component Props Interface
 */
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: 'row' | 'column';
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Professional Stack Component - Blinkit/BigBasket Style
 * 
 * Features:
 * - Flexible direction (row/column)
 * - Consistent spacing system
 * - Alignment and justification options
 * - Wrap support for responsive layouts
 * - Mobile-optimized spacing
 * - Polymorphic component support
 * 
 * Usage:
 * <Stack direction="column" spacing="lg" align="center">
 *   <Button>Action 1</Button>
 *   <Button>Action 2</Button>
 * </Stack>
 * 
 * <Stack direction="row" spacing="md" justify="between" wrap>
 *   <Card>Item 1</Card>
 *   <Card>Item 2</Card>
 * </Stack>
 */
const Stack = React.forwardRef<HTMLDivElement, StackProps>(({
  children,
  className,
  direction = 'column',
  spacing = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  as: Component = 'div',
  ...props
}, ref) => {
  // Direction classes
  const directionClasses = {
    row: 'flex-row',
    column: 'flex-col',
  };

  // Spacing classes based on direction
  const spacingClasses = {
    none: '',
    xs: direction === 'row' ? 'gap-1' : 'space-y-1',
    sm: direction === 'row' ? 'gap-2' : 'space-y-2',
    md: direction === 'row' ? 'gap-4' : 'space-y-4',
    lg: direction === 'row' ? 'gap-6' : 'space-y-6',
    xl: direction === 'row' ? 'gap-8' : 'space-y-8',
    '2xl': direction === 'row' ? 'gap-12' : 'space-y-12',
  };

  // Alignment classes
  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  // Justification classes
  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  // Combine all classes
  const stackClasses = cn(
    'flex',
    directionClasses[direction],
    spacingClasses[spacing],
    alignClasses[align],
    justifyClasses[justify],
    wrap && 'flex-wrap',
    className
  );

  const Element = Component as any;

  return (
    <Element
      ref={ref}
      className={stackClasses}
      {...props}
    >
      {children}
    </Element>
  );
});

Stack.displayName = 'Stack';

/**
 * HStack Component
 * Horizontal stack (row direction)
 */
interface HStackProps extends Omit<StackProps, 'direction'> {}

const HStack = React.forwardRef<HTMLDivElement, HStackProps>((props, ref) => {
  return <Stack ref={ref} direction="row" {...props} />;
});

HStack.displayName = 'HStack';

/**
 * VStack Component
 * Vertical stack (column direction)
 */
interface VStackProps extends Omit<StackProps, 'direction'> {}

const VStack = React.forwardRef<HTMLDivElement, VStackProps>((props, ref) => {
  return <Stack ref={ref} direction="column" {...props} />;
});

VStack.displayName = 'VStack';

/**
 * Center Component
 * Centers content both horizontally and vertically
 */
interface CenterProps extends Omit<StackProps, 'align' | 'justify'> {
  inline?: boolean;
}

const Center = React.forwardRef<HTMLDivElement, CenterProps>(({
  inline = false,
  className,
  ...props
}, ref) => {
  return (
    <Stack
      ref={ref}
      align="center"
      justify="center"
      className={cn(
        inline && 'inline-flex',
        className
      )}
      {...props}
    />
  );
});

Center.displayName = 'Center';

/**
 * Spacer Component
 * Flexible spacer for pushing elements apart
 */
interface SpacerProps extends React.HTMLAttributes<HTMLDivElement> {}

const Spacer = React.forwardRef<HTMLDivElement, SpacerProps>(({
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex-1', className)}
      {...props}
    />
  );
});

Spacer.displayName = 'Spacer';

/**
 * Divider Component
 * Visual separator between stack items
 */
interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(({
  orientation = 'horizontal',
  variant = 'solid',
  className,
  ...props
}, ref) => {
  const orientationClasses = {
    horizontal: 'w-full h-px',
    vertical: 'h-full w-px',
  };

  const variantClasses = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'bg-gray-200 border-gray-200',
        orientationClasses[orientation],
        variantClasses[variant],
        orientation === 'horizontal' ? 'border-t' : 'border-l',
        className
      )}
      role="separator"
      {...props}
    />
  );
});

Divider.displayName = 'Divider';

export {
  Stack,
  HStack,
  VStack,
  Center,
  Spacer,
  Divider,
};

export default Stack;
