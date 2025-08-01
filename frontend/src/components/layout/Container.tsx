import React from 'react';
import { cn } from '@/lib/utils';
import { containerVariants, type ContainerVariants } from '@/lib/variants';

/**
 * Container Component Props Interface
 * Enhanced with our variant system
 */
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement>, ContainerVariants {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
}

/**
 * Professional Container Component - Blinkit/BigBasket Style
 *
 * Features:
 * - Type-safe variants with CVA
 * - Responsive max-widths for different screen sizes
 * - Configurable padding levels
 * - Mobile-first approach
 * - Polymorphic component support
 * - Consistent with design system
 *
 * Usage:
 * <Container size="7xl" padding="lg">
 *   <h1>Page Content</h1>
 * </Container>
 */
const Container = React.forwardRef<HTMLDivElement, ContainerProps>(({
  children,
  className,
  size = '7xl',
  padding = 'default',
  as: Component = 'div',
  ...props
}, ref) => {
  // Use our variant system for consistent styling
  const containerClasses = cn(
    containerVariants({ size, padding }),
    className
  );

  const Element = Component as any;

  return (
    <Element
      ref={ref}
      className={containerClasses}
      {...props}
    >
      {children}
    </Element>
  );
});

Container.displayName = 'Container';

export default Container;
